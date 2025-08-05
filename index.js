import express from "express"
import dotenv from "dotenv"
import cors from "cors"
import router from "./routers/index.js"
import { generalLimiter, loginLimiter } from "./auth/rateLimit.js";
import adminRouter from './routers/admin.js'
dotenv.config()
const env = process.env
const app = express()
app.use(express.json())
app.use(cors())
const PORT = env.PORT || 5000
app.use(generalLimiter)
app.use("/admin", adminRouter)
app.use("/api", router)
app.use((err, req, res, next) => {
  console.error("🔥 Server error:", err.stack);
  res.status(500).json({ message: "Internal Server Error" });
});
app.use((req, res) => {
  res.status(404).json({ message: "API not found" });
});
app.listen(PORT, ()=> console.log("📈 API ready at Port" + PORT));