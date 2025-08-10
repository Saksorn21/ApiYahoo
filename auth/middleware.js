import jwt from "jsonwebtoken";
import LogModel from "../models/Log.js";
import { User} from 
"../models/User.js"
import TokenModel from 
"../models/Token.js"
import logger from "../utils/logger.js"
const findUserByToken = async (token) => {
  const decoded = jwt.verify(token, process.env.JWT_LOGIN_SECRET)
  const user = await User.findById(decoded.id)
  return user
}
export const adminCheck = async (req, res, next) => {
  // เช็ก user ใน token ว่าเป็น "admin"
  const token = req.token || req.cookies.accessToken
  if (!token) return res.status(401).json({ message: "No Token" });
  try {
    const user = findUserByToken(token)
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
    return res.status(403).json({ error: err });
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
function isJwt(token) {
  const jwtRegex = /^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+$/;
  return jwtRegex.test(token);
}
function isBase64Url(apiToken) {
  const base64UrlRegex = /^[A-Za-z0-9-_]+$/
  return base64UrlRegex.test(apiToken)
   
}
// ตรวจ Bearer สำหรับ API
export const authFromBearer = async (req, res, next) => {
  const authHeader = req.headers["authorization"];
  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "No token " });
  }
  const apiToken = authHeader.split(" ")[1];
  // กันคนส่ง headers ผิดรูปแบบ 
  //ex Bearer Bearer <token>
  //ex Bearer <token> Bearer
  if (!isBase64Url(apiToken)) return res.status(401).json({ error: "Invalid Bearer Token format: Bearer <token>"})
  try {
  
    const tokenDoc = await TokenModel.findOne({ apiToken }).lean()
  if (!tokenDoc) return res.status(403).json({ error: "Invalid token" });
  if (tokenDoc.expiresAt < new Date())
    return res.status(403).json({ error: "Token expired" });
    let decoded;
    try {
      decoded = jwt.verify(tokenDoc.refreshToken, process.env.JWT_SECRET);
    } catch (err){
      logger.debug("authFromBearer JWT Error:", err)
      return res.status(403).json({ error: "Invalid token signature" });
}
    
   const dataUser = await User.findById(decoded.id).lean();
    if (!dataUser) return res.status(403).json({ error: "Invalid token user" });
    if (dataUser.username !== tokenDoc.user) return res.status(403).json({ error: "Token user mismatch" });

    req.user = dataUser
    next();

  } catch (err) {
    logger.debug("authFromBearer Error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const logMiddleware = async (req, res, next) => {
  const start = process.hrtime(); // precise timer
  const user = req.user?.username || "anonymous";
  const ip = req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress;

  // ทำหลัง response เสร็จแล้ว
  res.on('finish', async () => {
    const [seconds, nanoseconds] = process.hrtime(start);
    const responseTime = (seconds * 1e3 + nanoseconds / 1e6).toFixed(2); // ms

    const logData = {
      user,
      action: `${req.method} ${req.originalUrl}`,
      ip,
      tokenId: req.user?.jti || undefined,
      endpoint: req.originalUrl,
      method: req.method,
      statusCode: res.statusCode,
      responseTime: parseFloat(responseTime),
    };

    try {
      await LogModel.create(logData);
    } catch (err) {
      console.error("Failed to save log:", err);
    }
  });

  next();
};