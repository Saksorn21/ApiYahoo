import Redis from "ioredis";
import logger from "./utils/logger.js";
import dotenv from "dotenv";
dotenv.config();

const redis = new Redis(process.env.REDIS_URL, {
  lazyConnect: true, // ไม่ connect จนกว่าจะเรียกใช้
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
  reconnectOnError: err => err.message.includes("ECONNRESET"),
  retryStrategy: times => {
    // retry แบบ exponential backoff
    return Math.min(50 * 2 ** times, 5000); // สูงสุด 5 วินาที
  },
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