import express from "express"
import dotenv from "dotenv"
import cors from "cors"
import http from 'http';
import mongoose from "mongoose"
import { authRouter } from "./routers/index.js"
import { swaggerJson, swaggerSpec, swaggerLimiter, loadSwagger } from "./swagger.js"
import { generalLimiter, rateLimitMembership } from "./auth/rateLimit.js";
import adminRouter from './routers/admin.js'
import apiRouter from './routers/apiRouter.js'
import swaggerUi from "swagger-ui-express";

import { corsOptionsDelegate } from "./cors.js"
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
const swaggerJs = swaggerUi
const swaggerDocument = await loadSwagger();
const io = await initSocket(server);
 
const PORT = env.PORT || 5000
mongoose.connect(process.env.MONGO_URI);

app.use(express.json())
app.use(cors(corsOptionsDelegate))
app.use(cookieParser());

app.set("trust proxy", 1)
logger.setSocketIO(io)
app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));
//app.use("/api-docs", swaggerLimiter, swaggerJs.serve, swaggerJs.setup(swaggerSpec))
app.use(generalLimiter)
app.use("/admin", adminRouter)
app.use("/auth", authRouter)
app.use("/v1/api",authFromBearer, rateLimitMembership, logConsole, logMiddleware, apiRouter)
app.post("/omise-webhook",webhook)
app.get("/v1/swaggerJson", swaggerJson)
app.use((err, req, res, next) => {
  console.error("🔥 Server error:", err.stack);
  res.status(500).json({ message: "Internal Server Error" });
});
app.use((req, res) => {
  res.status(404).json({ 
    method: req.method,
    url: req.url,
    message: "API not found" });
});


  

  server.listen(3000, () => console.log("🚀 Server running on " + PORT));
