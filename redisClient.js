import Redis from "ioredis";
import logger from "./utils/logger.js";
import dotenv from "dotenv";
dotenv.config();

const redis = new Redis(process.env.REDIS_URL, {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
  lazyConnect: true, // ไม่ connect จนกว่าจะใช้
  reconnectOnError: err => {
    return err.message.includes("ECONNRESET");
  },
  retryStrategy: times => Math.min(times * 50, 30000),
  keepAlive: 30000,
});

redis.on("connect", () => {
  console.log("🔍 Redis connected");
  logger.debug("Redis connected");
});

redis.on("error", (err) => {
  console.error("🔥 Redis error", err);
  logger.debug("Redis error", err);
});

redis.on("reconnecting", (time) => {
  console.log(`♻️ Redis reconnecting in ${time}ms`);
});

// ฟังก์ชันเชื่อมต่อแบบมั่นใจ
export async function connectRedis() {
  try {
    await redis.connect();
    console.log("✅ Redis fully connected");
  } catch (err) {
    console.error("❌ Redis failed to connect", err);
    setTimeout(connectRedis, 1000); // retry ทุก 1 วิ
  }
}

export default redis;