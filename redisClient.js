import Redis from "ioredis";
import logger from "./utils/logger.js"
import dotenv from "dotenv"
dotenv.config()
const redis = new Redis({
  host: process.env.REDIS_HOST,
  port: process.env.REDIS_PORT,
  username: process.env.REDIS_USERNAME,
  password: process.env.REDIS_PASSWORD,

});

redis.on("connect", () => logger.debug("Redis connected"));
redis.on("error", (err) => logger.debug("Redis error", err));

export default redis;