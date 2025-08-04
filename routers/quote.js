import axios from "axios";
import * as cheerio from 'cheerio';
import NodeCache from "node-cache";
const cache = new NodeCache({ stdTTL: 300 }); 
const headers = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"
}


export default async function quotes(req, res) {
   const symbol = req.params.symbol.toUpperCase();
     const cached = cache.get(symbol);
     if (cached) return res.json({ symbol, price: cached });

     try {
       const { data } = await axios.get(`https://finance.yahoo.com/quote/${symbol}`, { headers })
       const $ = cheerio.load(data);

       const price = $('span[data-testid="qsp-price"]').first().text();
       cache.set(symbol, price);
       res.json({ symbol, price });
     } catch (err) {
       res.status(500).json({ error: "Fetch error" });
     }
   }


const getPrice = async (ticker) => {
  const url = `https://finance.yahoo.com/quote/${ticker.toUpperCase().trim()}`;
  const { data } = await axios.get(url, { headers }); // โหลด HTML
  const $ = cheerio.load(data);         // ยัดเข้า cheerio
  
  const quote = {}
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
  quote.symbol = ticker
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
};

getPrice("TSM");

