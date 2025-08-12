import axios from "../utils/axios.js"
import logger from "../utils/logger.js"
import NodeCache from "node-cache";
const cache = new NodeCache({ stdTTL: 300 }); 

const chart = async (req, res) =>{
  const symbol = req.query.symbol.toUpperCase()
  const range = req.query.range || '1y'
  const interval = req.query.interval || '1d'
  const events = req.query.events ||"div, splits, capitalGains"
  
  if(!symbol) return res.status(400).json({ error: "No symbol"})
  try {
    const cached = cache.get(symbol);
     if (cached) return res.json( cached );
     const response = await axios.get(`/v8/finance/chart/${symbol}?range=${range}&interval=${interval}&events=${events}`)
     cache.set(symbol,response.data)

     res.status(200).json(response.data)
  } catch (err) {
    logger.debug("chart error: ", err)
     res.status(500).json({
       
       error: 'Server Data Error'})
  }
  
  
}
export default chart