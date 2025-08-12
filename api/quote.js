import axios from "../utils/axios.js";
import NodeCache from "node-cache";
import logger from "../utils/logger.js";
const cache = new NodeCache({ stdTTL: 300 });
export default async function quotes(req, res) {
  const symbol = req.params.symbol.toUpperCase();
  const cached = cache.get(symbol);
  if (cached) return res.json(cached);
  
  try {
    const { data } = await axios.get(
      `/v8/finance/chart/${symbol}?interval=1m&range=2d`,
    );
    const summary = {};
    const result = parseChartData(data, summary);
    delete result.hasPrePostMarketData;
    cache.set(symbol, result);
    res.json({ summary: result, error: null });
  } catch (err) {
    logger.debug("quote error: ", err);
    res.status(500).json({ error: "Fetch error" });
  }
}
function getMarketStatus(currentTradingPeriod) {
  const now = Math.floor(Date.now() / 1000);

  const pre = currentTradingPeriod.pre;
  const regular = currentTradingPeriod.regular;
  const post = currentTradingPeriod.post;

  if (now >= pre.start && now <= pre.end) return "PRE";
  if (now >= regular.start && now <= regular.end) return "REGULAR";
  if (now >= post.start && now <= post.end) return "POST";
  return "CLOSED"; // อยู่นอกช่วงตลาดเปิด
}

function parsePrePostMacket(price, summary, status) {
  switch (status) {
    case "PRE":
      summary.regularMarketPrice = price.regPrice;
      summary.regularMarketChange = price.regChange;
      summary.regularMarketChangePercent = price.regChangePct;

      summary.preMarketPrice = price.prePrice;
      summary.preMarketPriceChange = price.preChange;
      summary.preMarketChangePercent = price.preChangePct;
      break;
    case "REGULAR":
      summary.regularMarketPrice = price.regPrice;
      summary.regularMarketChange = price.regChange;
      summary.regularMarketChangePercent = price.regChangePct;
      //pre
      summary.preMarketPrice = price.prePrice;
      summary.preMarketPriceChange = price.preChange;
      summary.preMarketChangePercent = price.preChangePct;
      break;
    case "POST":
      summary.regularMarketPrice = price.regPrice;
      summary.regularMarketChange = price.regChange;
      summary.regularMarketChangePercent = price.regChangePct;
      summary.postMarketPrice = price.postPrice;
      summary.postMarketChange = price.postChange;
      summary.postMarketChangePercent = price.postChangePct;
      break;
    default:
      summary.regularMarketPrice = price.regPrice;
      summary.regularMarketChange = price.regChange;
      summary.regularMarketChangePercent = price.regChangePct;

      summary.preMarketPrice = meta.prePrice;
      summary.preMarketPrice = price.preChange;
      summary.preMarketChangePercent = price.preChangePct;
      summary.postMarketPrice = price.postPrice;
      summary.postMarketChange = price.postChange;
      summary.postMarketChangePercent = price.postChangePct;
  }
}
function filterTodayData(timestamps, closes) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStart = Math.floor(today.getTime() / 1000);
  const todayEnd = todayStart + 86400;

  return timestamps
    .map((t, i) => ({ time: t, price: closes[i] }))
    .filter(
      (x) => x.time >= todayStart && x.time < todayEnd && x.price != null,
    );
}

function getLastPriceInPeriod(timestamps, closes, period) {
  const OFFSET = 60; // ขยับให้เผื่อ 1 นาที
  const start = period.start - OFFSET;
  const end = period.end + OFFSET;

  const filtered = timestamps
    .map((t, i) => ({ time: t, price: closes[i] }))
    .filter((x) => x.time >= start && x.time <= end && x.price != null);

  if (!filtered.length) return null;
  return filtered[filtered.length - 1].price;
}
function buildPriceSummary(
  timestamps,
  closes,
  chartPreviousClose,
  currentTradingPeriod,
) {
  const { pre, regular, post } = currentTradingPeriod;

  const prePrice = getLastPriceInPeriod(timestamps, closes, pre);
  const regPrice = getLastPriceInPeriod(timestamps, closes, regular);
  const postPrice = getLastPriceInPeriod(timestamps, closes, post);

  return {
    regPrice,
    regChange:
      regPrice && chartPreviousClose ? regPrice - chartPreviousClose : null,
    regChangePct:
      regPrice && chartPreviousClose
        ? ((regPrice - chartPreviousClose) / chartPreviousClose) * 100
        : null,
    prePrice,
    preChange:
      prePrice && chartPreviousClose ? prePrice - chartPreviousClose : null,
    preChangePct:
      prePrice && chartPreviousClose
        ? ((prePrice - chartPreviousClose) / chartPreviousClose) * 100
        : null,
    postPrice,
    postChange: postPrice && regPrice ? postPrice - regPrice : null,
    postChangePct:
      postPrice && regPrice ? ((postPrice - regPrice) / regPrice) * 100 : null,
  };
}
function parseChartData(chartData, summary) {
  const meta = chartData.chart.result[0].meta;
  const timestamps = chartData.chart.result[0].timestamp;
  const chartPreviousClose = meta.chartPreviousClose;
  const closes = chartData.chart.result[0].indicators.quote[0].close;
  const periods = meta.currentTradingPeriod;
  const marketStatus = getMarketStatus(meta.currentTradingPeriod);
  summary.marketStatus = marketStatus;

  const prices = buildPriceSummary(
    timestamps,
    closes,
    chartPreviousClose,
    periods,
  );


  parsePrePostMacket(prices, summary, marketStatus);
  return {
    symbol: meta.symbol,
    longName: meta.longName,
    shortName: meta.shortName,
    exchangeName: meta.exchangeName,
    fullExchangeName: meta.fullExchangeName,
    instrumentType: meta.instrumentType,
    marketStatus,
    ...summary,
    chartPreviousClose: meta.chartPreviousClose,
    priceHint: meta.priceHint,
    firstTradeDate: meta.firstTradeDate,
    regularMarketTime: meta.regularMarketTime,
    hasPrePostMarketData: meta.hasPrePostMarketData,
    gmtoffset: meta.gmtoffset,
    timezone: meta.timezone,
    exchangeTimezoneName: meta.exchangeTimezoneName,
    currency: meta.currency,
  };
}