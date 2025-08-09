import axios from "../utils/axios.js"
import log from "../utils/log.js"

import NodeCache from "node-cache";
const cache = new NodeCache({ stdTTL: 300 }); 
const endpoint = 'api/chart'
const msg = 'Chart data Test Logger'
log.log('get','error',200,endpoint, 142,)
log.log('put','info', 401, endpoint, 400, '1'+msg)
log.log('post','log', 402, endpoint, 1200)
log.log('delete','warn', 500, endpoint, 300, '2' + msg)
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