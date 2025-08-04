import axios from "axios";
import * as cheerio from 'cheerio';
import NodeCache from "node-cache";
const cache = new NodeCache({ stdTTL: 300 }); 
const headers = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"
}
const url = "https://finance.yahoo.com/quote/AAPL";
function quote(req, res) {
   const symbol = req.params.symbol.toUpperCase();
     const cached = cache.get(symbol);
     if (cached) return res.json({ symbol, price: cached });

     try {
       const { data } = await axios.get(`https://finance.yahoo.com/quote/${symbol}`, { headers });
       const $ = cheerio.load(data);
       const price = $('fin-streamer[data-field="regularMarketPrice"]').first().text();
       cache.set(symbol, price);
       res.json({ symbol, price });
     } catch (err) {
       res.status(500).json({ error: "Fetch error" });
     }
   }
}

const getPrice = async () => {
  const { data } = await axios.get(url); // โหลด HTML
  const $ = cheerio.load(data);         // ยัดเข้า cheerio
  const price = $('fin-streamer[data-field="regularMarketPrice"]').first().text();
  console.log("ราคาหุ้น AAPL:", price);
};

getPrice();