import axios from "axios"
const URL = process.env.API_DATA_URL
const headers = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"
}
export default axios.create(URL, { headers })
