import rateLimit from "express-rate-limit";

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