import redis from "./redisClient.js";

// wrapper สำหรับ set session
export async function setSession(key, value, ttlSeconds = 86400) {
  let retries = 0;
  const maxRetries = 5;
  const delay = ms => new Promise(res => setTimeout(res, ms));

  while (retries < maxRetries) {
    try {
      await redis.set(key, value, "EX", ttlSeconds);
      return true;
    } catch (err) {
      console.error(`Redis set error (attempt ${retries + 1}):`, err.message);
      if (!err.message.includes("ECONNRESET")) throw err;
      retries++;
      await delay(100 * 2 ** retries); // exponential backoff
    }
  }
  throw new Error("Redis set failed after retries");
}