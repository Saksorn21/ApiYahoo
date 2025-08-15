import Redis from "ioredis";
import logger from "./utils/logger.js"
import dotenv from "dotenv"
dotenv.config()
const devconnet = {
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT,
    username: process.env.REDIS_USERNAME,
    password: process.env.REDIS_PASSWORD,
    maxRetriesPerRequest: null

  }
const isProd = process.env.NODE_ENV === "production" ?{ url: process.env.REDIS_PRIVATE_URL, maxRetriesPerRequest: null} : devconnet
const redis = new Redis(isProd);

redis.on("connect", () => {
  console.log("🔍 Redis connected")
  logger.debug("Redis connected")
});
redis.on("error", (err) => {
  console.error("🔥 Redis error" , err)
  logger.debug("Redis error", err)});

export default redis;