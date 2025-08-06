import jwt from "jsonwebtoken";
import LogModel from "../models/Log.js";
import { User} from "../models/User.js"
const findUserByToken = async (token) => {
  const decoded = jwt.verify(token, process.env.JWT_LOGIN_SECRET)
  const user = await User.findById(decoded.id)
  return user.username
}
export const adminCheck = async (req, res, next) => {
  // เช็ก user ใน token ว่าเป็น "admin"
  const token = req.token || req.cookies.accessToken
  if (!token) return res.status(401).json({ message: "No Token" });
  try {
    const decoded = jwt.verify(token, process.env.JWT_LOGIN_SECRET)
    const user = await User.findById(decoded.id)
    if (user.role !== "admin") {
      return res.status(403).json({ error: "Admin only access" });
    }
    req.user = user
    next();
  } catch ( err) {
    res.status(401).json({ message: "Invalid token" });
  }
  
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
// ตรวจ login token จาก cookie
export const authFromCookie = async (req, res, next) => {
  const token = req.cookies.accessToken;
  if (!token) return res.status(401).json({ error: "No token" });

  try {
    const user = await findUserByToken(token)
    req.user = user;
    next();
  } catch (err) {
    return res.status(403).json({ error: "Invalid token" });
  }
};

// ตรวจ Bearer สำหรับ API
export const authFromBearer = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "No token" });
  }
  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    req.token = token
    next();
  } catch (err) {
    return res.status(403).json({ error: "Invalid token" });
  }
};
const ch