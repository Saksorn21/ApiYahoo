import axios from "../utils/axios.js";
import * as cheerio from 'cheerio';
import NodeCache from "node-cache";
import logger from "../utils/logger.js"
const cache = new NodeCache({ stdTTL: 300 }); 
const headers = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"
}


export default async function quotes(req, res) {
   const symbols = req.params.symbol.toUpperCase();
     const cached = cache.get(symbols);
     if (cached) return res.json(cached);
  https://query1.finance.yahoo.com/v7/finance/quote?symbols=NVDA
     try {
       const { data } = await axios.get(`/v7/finance/quote?${symbols}`)
       
       cache.set(symbols, data);
       res.json({data,error: null});
     } catch (err) {
       logger.debug("quote error: ", err)
       res.status(500).json({ error: "Fetch error" });
     }
   }


const getPrice = async (ticker) => {
  const symbol = ticker.toUpperCase().trim()
  const url = `https://finance.yahoo.com/quote/${symbol}`;
  console.log(symbol, url)
  try {
     
  
  const { data } = await axios.get(url, { headers }); // โหลด HTML
  const $ = cheerio.load(data);         // ยัดเข้า cheerio
  
  const quote = {}
    const exchangeText = $('span.exchange').first().text().trim();
    const marketName = exchangeText.split(" - ")[0];  // เอาก่อน '-'

    // ดึงชื่อบริษัทและ ticker เช่น "NVIDIA Corporation (NVDA)"
    const titleText = $('title').text().trim();
    const match = titleText.match(/^(.*?) \(([^)]+)\)/);
    let companyName = "";

    if (match) {
      companyName = match[1];  // NVIDIA Corporation
    }     
  const price = $('span[data-testid="qsp-price"]').first().text();
  const change = $('span[data-testid="qsp-price-change"]').first().text()
  const cache = new NodeCache({stdTTL: 300})
  const cached = cache.get(ticker)
  
  const open =  $('fin-streamer[data-field="regularMarketOpen"]').first().text()
  const changePercent = $('span[data-testid="qsp-price-change-percent"]').first().text().replace(/[(),%]/g, "")
  const prePrice =  $('span[data-testid="qsp-pre-price"]').first().text()
  const preChange = $('span[data-testid="qsp-pre-price-change"]').first().text()
  const preChangePercent = $('span[data-testid="qsp-pre-price-change-percent"]').first().text().replace(/[(),%]/g, "")
  const postPrice =  $('span[data-testid="qsp-post-price"]').first().text()
  const postChange = $('span[data-testid="qsp-post-price-change"]').first().text()
  const postChangePercent = $('span[data-testid="qsp-post-price-change-percent"]').first().text().replace(/[(),%]/g, "")
  const market = $('fin-streamer[changeev="timeChange"]').attr("data-field")
  quote.symbol = symbol
  quote.longName = companyName
  quote.exchange = marketName
  quote.price = price.trim()
  quote.change = change.trim()
  quote.changePercent = changePercent.trim()
  if(market.trim() === 'preMarketTime'){
    quote.prePrice = prePrice.trim()
    quote.preChange = preChange.trim()
    quote.preChangePercent = preChangePercent.trim()
  }else{
    quote.postPrice = postPrice.trim()
    quote.postChange = postChange.trim()
    quote.postChangePercent = postChangePercent.trim()
  }
    
  const stats = {};

  $("fin-streamer").each((_, el) => {
    const field = $(el).attr("data-field");
    const value = $(el).text().trim();
    if (field && value) {
        quote[field] = value;
    }
  });

  console.log(stats)
  console.log("ราคาหุ้น AAPL:", price, open);
   
  quote.marksetState = market
  console.log(quote)
    } catch (error) {
console.error(error)
    }
};
const url = "https://query1.finance.yahoo.com/v8/finance/chart/NVDA?range=1d&interval=2m";
/** 
axios.get(url).then(res => {
  const result = res.data.chart.result[0];
  const lastClose = result.meta.regularMarketPrice;
  console.log()
  console.log("ราคาล่าสุด BTC:", lastClose);
});
//getPrice("NVDA");
*/
