import jwt from "jsonwebtoken";
import LogModel from "../models/Log.js";
import { User} from 
"../models/User.js"
import TokenModel from 
"../models/Token.js"
import logger from "../utils/logger.js"
import redis from "../redisClient.js"
const findUserByToken = async (token) => {
  const decoded = jwt.verify(token, process.env.JWT_LOGIN_SECRET)
  const user = await User.findById(decoded.id).lean().select("-password")
  return user
}
export const adminCheck = async (req, res, next) => {
  // เช็ก user ใน token ว่าเป็น "admin"
  const token = req.token || req.cookies.accessToken
  try {
    const user = await findUserByToken(token)
    if (user.role !== "admin") {
      console.debug("adminCheck : ", user)
      return res.status(403).json({ 
        success: false,
        statusCode: 403,
        code: 'ADMIN_ONLY',
        message: "Admin only access" });
    }
    req.user = user
    next();
  } catch ( err) {
    logger.debug("adminCheck Error: ", err)
    res.status(401).json({ 
      success: false,
      statusCode: 401,
      code: 'INVALID_TOKEN',
      message: "Invalid token" });
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
  if (!token) {
    logger.debug("adminCheck token Error: ", token)
    return res.status(401).json({ 
    success: false,
    statusCode: 401,
    code: 'NO_TOKEN',
    message: "No token provided" });
    }

  try {
    const user = await findUserByToken(token)
    res.user = user;
    next();
  } catch (err) {
    logger.debug("Check Cookies Error: ", err)
    return res.status(403).json({ 
      success: false,
      statusCode: 403,
      code: 'INVALID_TOKEN',
      message: "Invalid or expired token" });
  }
};

// Middleware: checkLogin
export const checkLogin = async (req, res, next) => {
    const accessToken = req.cookies.accessToken;

    if (!accessToken) {
        return res.status(401).json({
            success: false,
            statusCode: 401,
            code: 'NO_TOKEN',
            message: "No token provided"
        });
    }

    try {
        const decoded = jwt.verify(accessToken, process.env.JWT_LOGIN_SECRET);
        const userId = decoded.id;

        // ดึง accessToken ที่บันทึกไว้ใน Redis ด้วย userId
        const savedToken = await redis.get(`session:${userId}`);

        // ตรวจสอบว่า accessToken ที่ส่งมาตรงกับที่บันทึกไว้ใน Redis หรือไม่
        if (savedToken !== accessToken) {
            // ถ้าไม่ตรง แสดงว่า Session หมดอายุ หรือมีการล็อกอินจากเครื่องอื่น
            return res.status(403).json({ 
                success: false,
                statusCode: 403,
                code: 'SESSION_EXPIRED',
                message: "Session expired or logged in elsewhere"
            });
        }

        // ถ้าตรงกัน ให้หาข้อมูลผู้ใช้และส่งต่อไปยัง route
        const user = await findUserByToken(accessToken);
        res.user = user;
        next();

    } catch (err) {
        // หาก accessToken ไม่ถูกต้องหรือหมดอายุ
        return res.status(403).json({
            success: false,
            statusCode: 403,
            code: 'INVALID_TOKEN',
            message: "Invalid or expired token"
        });
    }
};

// Middleware: preventAccessIfLoggedIn
export const preventAccessIfLoggedIn = async (req, res, next) => {
    const accessToken = req.cookies.accessToken;
    // ถ้าไม่มี accessToken ให้ผ่านไปได้เลย
    if (!accessToken) {
        return next();
    }

    try {
        // ตรวจสอบความถูกต้องของ accessToken
        const decoded = jwt.verify(accessToken, process.env.JWT_LOGIN_SECRET);
        const userId = decoded._id;

        const savedToken = await redis.get(`session:${userId}`);

        // ถ้า Session ใน Redis ยังตรงกับ accessToken ที่ส่งมา
        // ให้แจ้งเตือนว่าล็อกอินอยู่แล้ว
        if (savedToken === accessToken) {
            return res.status(400).json({
                success: false,
                statusCode: 400,
                code: 'ALREADY_LOGGED_IN',
                message: 'You are already logged in'
            });
        }

        // ถ้า Session ไม่ตรงหรือหมดอายุ ให้ผ่านไป
        next();

    } catch (err) {
        // ถ้า accessToken ไม่ถูกต้องหรือหมดอายุ ให้ผ่านไป
        next();
    }
};

function isBase64Url(apiToken) {
  const base64UrlRegex = /^[A-Za-z0-9-_]+$/
  return base64UrlRegex.test(apiToken)
   
}
// ตรวจ Bearer สำหรับ API
export const authFromBearer = async (req, res, next) => {
  const authHeader = req.headers["authorization"];
  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({ 
      error: {
      statusCode: 401,
      code: 'BEARER_REQUIRED',
      message: "Bearer token required in Authorization header (Authorization: Bearer <apiToken>)"
      } });
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