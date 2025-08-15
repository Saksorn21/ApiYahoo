import rateLimit from "express-rate-limit";
import logger from "../utils/logger.js"
import Membership from "../models/Membership.js"
import redis from '../redisClient.js'

const LIMITS = {
  free: 100,
  pro: 1000,
  enterprise: Infinity,
};

export async function rateLimitMembership(req, res, next) {
  try {
    const userId = req.user._id; // สมมติ userId มาจาก auth middleware
    const membership = await Membership.findOne({ userId })
    if (!membership) return res.status(403).json({ error: "Membership not found" });

    const limit = LIMITS[membership.membershipLevel] ?? 100;
    const key = `ratelimit:${userId}`;
    let count = await redis.incr(key);
   let ttl
      if (count === 1) {
        const now = new Date();
        const reset = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
        ttl = Math.floor((reset.getTime() - now.getTime()) / 1000);
        await redis.expire(key, ttl);
      } else {
        // ถ้า key มีอยู่แล้ว ให้ดึง ttl ปัจจุบันจาก redis
        ttl = await redis.ttl(key);
    }

    if (count > limit) {
      res.setHeader("X-RateLimit-Limit", limit);
      res.setHeader("X-RateLimit-Remaining", 0);
      res.setHeader("X-RateLimit-Reset", Math.floor(Date.now() / 1000) + ttl);
      logger.debug(`Rate limit exceeded for user ${req.user.username}`)
      return res.status(429).json({
        message: "API rate limit exceeded" });
    }
logger.debug(`Rate limit for user ${req.user.username}: ${count}/${limit}`)
    // ส่ง header บอกจำนวนเหลือ
    res.setHeader("X-RateLimit-Limit", limit);
    res.setHeader("X-RateLimit-Remaining", Math.max(limit - count, 0));
    res.setHeader("X-RateLimit-Reset", Math.floor(Date.now() / 1000) + ttl);

    next();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
}
// 🔐 Limit ทุกคน: 100 requests/15 นาที
export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 นาที
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: "🚫 Too many requests, try again later."
});

// 🔐 Limit เฉพาะ login route: กัน brute force
export const loginLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 นาที
  max: 5,
  message: "🚫 Too many login attempts. Wait 10 min."
});