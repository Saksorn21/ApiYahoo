import axios from "./utilities/axios.js"
import log from "./utilities/log.js"
import NodeCache from "
import NodeCache from "node-cache";
const cache = new NodeCache({ stdTTL: 300 }); 
const mgs = 'Test message'
log.log('error', msg)
log.log('info', msg)
log.log('log', msg)
log.log('warn', mag)
const chart = async (req, res) =>{
  const symbol = req.params.symbol.toUpperCase()
  const range = req.params.range || '1y'
  const interval = req.params.interval || '1d'
  const events = req.params.events // div, splits capitalGains
  
  if(!symbol) return res.status(400).json({ error: "No symbol"})
  try {
    const cached = cache.get(symbol);
     if (cached) return res.json({ symbol, price: cached });
     const data = await axios.get(`/v8/finance/chart/${symbol}?range=${range}&interval=${interval}&events=${events}`)
     cached.set(data)

     res.status(200).json(data)
  } catch (err) {
    
     res.status(500).json({
       
       error: 'Server Data Error'})
  }
  
  
}