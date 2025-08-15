import Redis from "ioredis";
import logger from "./utils/logger.js";
import dotenv from "dotenv";
dotenv.config();

const devConnect = {
  host: process.env.REDIS_HOST,
  port: parseInt(process.env.REDIS_PORT, 10),
  username: process.env.REDIS_USERNAME,
  password: process.env.REDIS_PASSWORD,
  maxRetriesPerRequest: null,
  retryStrategy: times => {
    // retry ทุก 2^n * 100 ms สูงสุด 30s
    const delay = Math.min(times * 50, 30000);
    return delay;
  },
  keepAlive: 30000, // keepalive 30 วินาที
};

const redis = process.env.NODE_ENV === "production"
  ? new Redis(process.env.REDIS_URL, {
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
      reconnectOnError: err => {
        console.error("Redis reconnectOnError", err.message);
        // reconnect ถ้าเป็น ECONNRESET
        return err.message.includes("ECONNRESET");
      },
      retryStrategy: times => Math.min(times * 50, 30000),
      keepAlive: 30000,
    })
  : new Redis(devConnect);

redis.on("connect", () => {
  console.log("🔍 Redis connected");
  logger.debug("Redis connected");
});

redis.on("error", (err) => {
  console.error("🔥 Redis error", err);
  logger.debug("Redis error", err);
});

// reconnect log
redis.on("reconnecting", (time) => {
  console.log(`♻️ Redis reconnecting in ${time}ms`);
});

export default redis;