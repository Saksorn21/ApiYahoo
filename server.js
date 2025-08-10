import express from "express"
import dotenv from "dotenv"
import cors from "cors"
import http from 'http';
import mongoose from "mongoose"
import router, { authRouter } from "./routers/index.js"
import { swaggerJson, swaggerSpec, swaggerLimiter } from "./swagger.js"
import { generalLimiter, rateLimitMembership } from "./auth/rateLimit.js";
import adminRouter from './routers/admin.js'
import swaggerUi from "swagger-ui-express";
import swaggerJSDoc from "swagger-jsdoc";
import rateLimit from "express-rate-limit";
import cookieParser from "cookie-parser";

import { logMiddleware, authFromBearer } from './auth/middleware.js'
import { logConsole } from './auth/loggerMiddleware.js'
import logger from './utils/logger.js'
import { initSocket } from './socket.js';
import { webhook } from "./routers/webhook.js"


dotenv.config()

const env = process.env
const app = express()
const server = http.createServer(app);

const io = await initSocket(server);
 logger.setSocketIO(io)
const PORT = env.PORT || 5000
mongoose.connect(process.env.MONGO_URI);
app.use(express.json())
app.use(cors())
app.use(cookieParser());

app.set("trust proxy", 1)
app.use("/api-docs", swaggerLimiter, swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.use(generalLimiter)
app.use("/admin", adminRouter)
app.use("/auth", authRouter)
app.use("/api",authFromBearer, rateLimitMembership, logConsole, logMiddleware, router)
app.post("/omise-webhook",webhook)
app.get("/v1/swaggerJson", swaggerJson)
app.use((err, req, res, next) => {
  console.error("🔥 Server error:", err.stack);
  res.status(500).json({ message: "Internal Server Error" });
});
app.use((req, res) => {
  res.status(404).json({ message: "API not found" });
});
server.listen(PORT, ()=> console.log("📈 API ready at Port" + PORT));