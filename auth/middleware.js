import jwt from "jsonwebtoken";
import LogModel from "../models/Log.js";

export const adminCheck = (req, res, next) => {
  // เช็ก user ใน token ว่าเป็น "admin"
  if (req.user?.user !== "admin") {
    return res.status(403).json({ error: "Admin only access" });
  }
  next();
};
export const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers["authorization"];
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Invalid authorization header" });
  }

  const token = authHeader.split(" ")[1];

  if (!token) return res.status(401).json({ error: "No token provided" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // เก็บ user ให้ใช้ต่อใน route

    // ✅ Log การใช้งาน
    const log = new LogModel({
      user: decoded.user,
      action: req.method + " " + req.originalUrl,
      ip: req.ip,
      tokenId: decoded.jti || null
    });
    await log.save();

    next();
  } catch (err) {
    return res.status(403).json({ error: "Invalid token" });
  }
};