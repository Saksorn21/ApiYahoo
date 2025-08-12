import axios from "../utils/axios.js"
import logger from "../utils/logger.js"
import NodeCache from "node-cache";
const cache = new NodeCache({ stdTTL: 300 }); 

const search = async (req, res) => {
    const query = req.query.q
    if(!query) return res.status(400).json({ error: "No query"})
  try {
     const cached = cache.get(query)
    if(cached) return res.json(cached)
    const { data } = await axios.get(`/v1/finance/search?q=${query}`)
    const result = data.quotes
    cache.set(query, result)
    res.json({search:result})
  } catch (error) {
     logger.debug("search error:", error)
    res.status(500).json({ error: "Fetch error"})
  }
  
}
const searchAutoComplete = async (req, res) => {
    const query = req.query.q
    if(!query) return res.status(400).json({ error: "No query"})
  try {
     const cached = cache.get(query)
    if(cached) return res.json(cached)
      const { data } = await axios.get(`/v1/finance/search?q=${query}`)
      const result = data.quotes.map(q => q.symbol)
     cache.set(query, result)
    res.json({search: [...result]})
  } catch (error) {
     logger.debug("search autocomplete error:", error)
     res.status(500).json({ error: "Fetch error"})
  }
  
}
( async () =>{
  const c = cache.get('NVDA')
  if (c) {
      const result = c.quotes
      console.log(result)
      const result2 = c.quotes.map(q => q.symbol)
      console.log(result2)
    return
    }
  const { data } = await axios.get(`/v1/finance/search?q=NVDA`)
  
  const result = data.quotes
  cache.set('NVDA', result)
  console.log(result)
  const result2 = data.quotes.map(q => {return {
    symbol: q.symbol,
    name: q.longname,
    type: q.quoteType
  }})
  console.log(result2)
})
export { search, searchAutoComplete}