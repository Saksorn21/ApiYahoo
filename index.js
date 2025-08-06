import express from "express"
import dotenv from "dotenv"
import cors from "cors"
import router, { authRouter } from "./routers/index.js"
import { generalLimiter, loginLimiter } from "./auth/rateLimit.js";
import adminRouter from './routers/admin.js'
import swaggerUi from "swagger-ui-express";
import swaggerJSDoc from "swagger-jsdoc";
import rateLimit from "express-rate-limit";

const swaggerLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 นาที
  max: 20, // Swagger ไม่ควรโดน spam
  message: "Too many requests to Swagger, chill bro 🚫🔥",
});


const swaggerOptions = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "PortSnap API",
      description: "API documentation for PortSnap Yahoo Finance API",
      version: "1.0.0",
    },
    tags: [
      { name: "Admin", description: "Admin-only endpoints" },
      { name: "API", description: "Public API for clients" },
      { name: "Auth", description: "Authentication endpoints"}
    ],
    servers: [{ url: "https://44c550b7-54f4-4174-bd1d-c51ff1e4f8c8-00-1wilq50r88xfl.janeway.replit.dev" }],
  },
  apis: ["./routers/*.js"], // ตรงนี้ชี้ไฟล์ route ที่มีคอมเมนต์
};

const swaggerSpec = swaggerJSDoc(swaggerOptions);


dotenv.config()
const env = process.env
const app = express()
const PORT = env.PORT || 5000
app.use(express.json())
app.use(cors())
app.set("trust proxy", 1)
app.use("/api-docs", swaggerLimiter, swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.use(generalLimiter)
app.use("/admin", adminRouter)
app.use("/auth", authRouter)
app.use("/api", router)
app.use((err, req, res, next) => {
  console.error("🔥 Server error:", err.stack);
  res.status(500).json({ message: "Internal Server Error" });
});
app.use((req, res) => {
  res.status(404).json({ message: "API not found" });
});
app.listen(PORT, ()=> console.log("📈 API ready at Port" + PORT));