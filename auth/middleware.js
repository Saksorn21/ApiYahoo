import jwt from "jsonwebtoken";
import LogModel from "../models/Log.js";
import { User} from 
"../models/User.js"
import TokenModel from 
"../models/Token.js"
import logger from "../utils/logger.js"
import redis from "../redisClient.js"
import chalk from "chalk"
export const startMode = (req, res, next) => {
  if (process.env.NODE_ENV === "development"){
    console.log(chalk.green.bold("⚙️🚀 Development Mode"))
    const cookieHeader = req.headers["Cookie"];
        if (cookieHeader) {
          // สมมติ cookieHeader = "accessToken=xxx; something=yyy"
          const cookies = Object.fromEntries(
            cookieHeader.split(";").map(c => {
              const [k, v] = c.trim().split("=");
              return [k, v];
            })
          );
         token = req.devToken = cookies.accessToken;
          console.log( cookieHeader,req.devToken, token)
          next();
        }
      } 
  next();
      }
    
export const checkHeaderDebug = (req, res, next) => {
  const debugHeader = req.headers['x-debug']
  logger.setDebug(debugHeader === 'true')
  next()
}
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
const checkToken = async (req) => {
  let token;

  if (process.env.NODE_ENV === "development") {
    // Dev: อ่าน token จาก header cookie (Swagger ส่งมา)
    const cookieHeader = req.headers["x-access-token"];
    
    if (cookieHeader) {
      
      token = cookieHeader;
    }
  } else {
    // Prod: ใช้ cookie-parser ปกติ
    token = req.cookies?.accessToken;
  }
  return token
}
// ตรวจ login token จาก cookie
export const authFromCookie = async (req, res, next) => {
  const token = await checkToken(req)

  
    // Dev: อ่าน token จาก header cookie (Swagger ส่งมา)
    

  if (!token) {
    logger.console('ERROR','No token provided')
    return res.status(401).json({ 
      success: false,
      statusCode: 401,
      code: 'NO_TOKEN',
      message: "No token provided"
    });
  }

  try {
    const user = await findUserByToken(token);
    req.user = user;
    req.token = token;
    next();
  } catch (err) {
    logger.log("Check Cookie Error: ", err)
    return res.status(403).json({ 
      success: false,
      statusCode: 403,
      code: 'INVALID_TOKEN',
      message: "Invalid or expired token"
    });
  }
};

// Middleware: checkLogin
export const checkLogin = async (req, res, next) => {
  const accessToken = req.token || req.cookies?.accessToken;

  if (!accessToken) {
    logger.console('error',"checkLogin error")
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

    const savedToken = await redis.get(`session:${userId}`);

    if (savedToken !== accessToken) {
      return res.status(403).json({ 
        success: false,
        statusCode: 403,
        code: 'SESSION_EXPIRED',
        message: "Session expired or logged in elsewhere"
      });
    }

    // attach user (ไม่ต้อง findUserByToken ซ้ำถ้า authFromCookie attach แล้ว)
    req.user = req.user || await findUserByToken(accessToken);

    next();
  } catch (err) {
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
  const token = await checkToken(req)
    const accessToken = req.cookies.accessToken || token
  
    // ถ้าไม่มี accessToken ให้ผ่านไปได้เลย
    if (!accessToken) {
        return next();
    }

    try {
        // ตรวจสอบความถูกต้องของ accessToken
        const decoded = jwt.verify(accessToken, process.env.JWT_LOGIN_SECRET);
        const userId = decoded.id;

        const savedToken = await redis.get(`session:${userId}`);

        // ถ้า Session ใน Redis ยังตรงกับ accessToken ที่ส่งมา
        // ให้แจ้งเตือนว่าล็อกอินอยู่แล้ว
        if (savedToken === accessToken) {
          req.token = accessToken
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