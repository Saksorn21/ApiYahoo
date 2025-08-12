import logger from "../utils/logger.js"
import axios from "../utils/axios.js"
import NodeCache from "node-cache";
const cache = new NodeCache({ stdTTL: 300 }); 
const news = async (req, res) => {
   const symbol = req.query.symbol.toUpperCase()
  const limit = req.query.limit || 10

  if(!symbol) return res.status(400).json({ error: "No symbol"})
  try {
  const cached = cache.get(symbol)
    if(cached) return res.json(cached)
  const { data } = await axios.get(`/v1/finance/search?q=${symbol}&newsCount=${limit}`)
cache.set(symbol, data)
    res.json({news: data.news, error: null})
    } catch (err) {
     logger.debug("news error: ", err)
    res.status(500).json({ error: "Fetch error"})
    }
}
export default news