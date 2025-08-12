import axios from "../utils/axios.js";
import * as cheerio from 'cheerio';
import NodeCache from "node-cache";
import logger from "../utils/logger.js"
const cache = new NodeCache({ stdTTL: 300 }); 
const headers = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"
}
export default async function quotes(req, res) {
   const symbol = req.params.symbol.toUpperCase();
     const cached = cache.get(symbol);
     if (cached) return res.json(cached);
  //https://query1.finance.yahoo.com/v8/finance/chart/V?interval=1d&range=1d
     try {
       const { data } = await axios.get(`/v8/finance/chart/${symbol}?interval=1d&range=1d`)
       const summary = {}
       const meta = data.chart.result[0].meta
      meta.regularMarketChange = meta.regularMarketPrice - meta.chartPreviousClose;
       meta.regularMarketChangePercent = (regularMarketChange / meta.chartPreviousClose) * 100;
       delete meta.currentTradingPeriod
       delete meta.validRanges
       delete meta.dataGranularity
       delete meta.range
       cache.set(symbol, data);
       res.json({summary: meta,error: null});
     } catch (err) {
       logger.debug("quote error: ", err)
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

function parsePrePostMacket(price, summary,status) {
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
           summary.postMarketPrice = price.postPrice
        summary.postMarketChange = price.postChange
           summary.postMarketChangePercent = price.postChangePct;
         break;
       default:
         summary.regularMarketPrice = price.regPrice;
          summary.regularMarketChange = price.regChange;
          summary.regularMarketChangePercent = price.regChangePct;

         summary.preMarketPrice = meta.prePrice;
          summary.preMarketPrice = price.preChange;
          summary.preMarketChangePercent = price.preChangePct;
         summary.postMarketPrice = price.postPrice
         summary.postMarketChange = price.postChange
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
    .filter(x => x.time >= todayStart && x.time < todayEnd && x.price != null);
}

function getLastPriceInPeriod(timestamps, closes, period) {
  const OFFSET = 60; // ขยับให้เผื่อ 1 นาที
  const start = period.start - OFFSET;
  const end = period.end + OFFSET;

  const filtered = timestamps
    .map((t, i) => ({ time: t, price: closes[i] }))
    .filter(x => x.time >= start && x.time <= end && x.price != null);

  if (!filtered.length) return null;
  return filtered[filtered.length - 1].price;
}
function buildPriceSummary(timestamps, closes, meta) {
  const { pre, regular, post } = meta.currentTradingPeriod;

  const prePrice = getLastPriceInPeriod(timestamps, closes, pre);
  const regPrice = getLastPriceInPeriod(timestamps, closes, regular);
  const postPrice = getLastPriceInPeriod(timestamps, closes, post);

  return {
    regPrice,
    regChange: regPrice && meta.chartPreviousClose ? regPrice - meta.chartPreviousClose : null,
    regChangePct: regPrice && meta.chartPreviousClose ? ((regPrice - meta.chartPreviousClose) / meta.chartPreviousClose) * 100 : null,
    prePrice,
    preChange: prePrice && meta.chartPreviousClose ? prePrice - meta.chartPreviousClose : null,
    preChangePct: prePrice && meta.chartPreviousClose ? ((prePrice - meta.chartPreviousClose) / meta.chartPreviousClose) * 100 : null,
    postPrice,
    postChange: postPrice && regPrice ? postPrice - regPrice : null,
    postChangePct: postPrice && regPrice ? ((postPrice - regPrice) / regPrice) * 100 : null
  }
}
function parseChartData(chartData, summary) {
  const meta = chartData.chart.result[0].meta;
  const timestamps = chartData.chart.result[0].timestamp
  
  const indicators = chartData.chart.result[0].indicators.quote[0]; // quote เป็น array เดียว
  const closes = indicators.close;
  const periods = meta.currentTradingPeriod;
  const prevClose = meta.chartPreviousClose
  const lastIndex = timestamps.length - 1;
  const prevIndex = lastIndex - 1;
  const todayData = filterTodayData(timestamps, closes);
  const marketStatus = getMarketStatus(meta.currentTradingPeriod);
  summary.marketStatus = marketStatus
  const regularMarketPrice = indicators.close[lastIndex];
  const regularMarketPreviousClose = indicators.close[prevIndex];

  const prices = buildPriceSummary(timestamps, closes, meta);
  // สถานะตลาดปัจจุบัน
  // marketState อาจไม่มีใน meta ต้องสร้าง logic กำหนดเอง
  
  parsePrePostMacket(prices, summary, marketStatus)
  return {
    symbol: meta.symbol,
    longName: meta.longName,
    shortName: meta.shortName,
    exchangeName: meta.exchangeName,
    fullExchangeName: meta.fullExchangeName,
    instrumentType: meta.instrumentType,
    firstTradeDate: meta.firstTradeDate,
    regularMarketTime: meta.regularMarketTime,
    marketStatus,
    hasPrePostMarketData: meta.hasPrePostMarketData,
    gmtoffset: meta.gmtoffset,
    timezone: meta.timezone,
    exchangeTimezoneName: meta.exchangeTimezoneName,
    regularMarketPrice,
    currency: meta.currency,
    chartPreviousClose: meta.chartPreviousClose,
    priceHint: meta.priceHint
  };
}


async function testq() {
   try {
      const { data } = await axios.get(`/v8/finance/chart/NVDA?interval=1m&range=2d`)
       const summary = {}
     const meta = data.chart.result[0].meta
     const result = {...parseChartData(data,summary),...summary}
     delete meta.currentTradingPeriod
      delete meta.validRanges
      delete meta.dataGranularity
      delete meta.range
     console.log(result);
   } catch (err) {
      console.error(err)
   }
   
}
(async () => await testq())()