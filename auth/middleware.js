import jwt from "jsonwebtoken";
import LogModel from "../models/Log.js";
import { User} from 
"../models/User.js"
import TokenModel from 
"../models/Token.js"
import logger from "../utilities/log.js"
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
function isJwt(token) {
  const jwtRegex = /^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+$/;
  return jwtRegex.test(token);
}
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

// ตรวจ Bearer สำหรับ API
export const authFromBearer = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "No token " });
  }
  const token = authHeader.split(" ")[1];
  if (!isJwt(token)) return res.status(401).json({ error: "Invalid Bearer Token format: Bearer <token>"})
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const dataUser = User.findById(decoded.id)
    req.user = dataUser.username
    req.token = token
    next();
  } catch (err) {
    return res.status(403).json({ error: "Invalid token" });
  }
};
export const bearerApiToken = (req, res, next) =>{
  const token = req.token
  const user = req.user
  const storedToken = TokenModel.findOne({ refreshToken: token})
  if (storedToken.user !== user) return res.status(403).json({ error: "ข้อมูลไม่ตรง"})
  const now = new Date();
  if (storedToken.expiresAt < now) {
    return res.status(403).json({ error: "Refresh token expired" });
  }
  
  next()
}

export const logConsole = (req, res, next) => {
  const start = process.hrtime();

  res.on('finish', () => {
    try {
      const [sec, nano] = process.hrtime(start);
      const responseTime = (sec * 1e3 + nano / 1e6).toFixed(2);

      const logLevel = getLogLevel(res.statusCode);
      logger.log(
        req.method,
        logLevel,
        res.statusCode,
        req.originalUrl,
        parseFloat(responseTime),
        res.locals.errorMessage // เผื่อ middleware อื่นตั้งค่าไว้
        if (process.env.NODE_ENV === 'development') {
          console.log('📝 Body:', req.body);
          console.log('🔍 Query:', req.query);
        }
      );
    } catch (err) {
      console.error('Logger error:', err);
    }
  });

  next();
};

// แยก function เอาไว้ตัดสินใจสีและ log type
function getLogLevel(status) {
  if (status >= 500) return 'error';
  if (status >= 400) return 'error';
  if (status >= 300) return 'warn';
  return 'info';
}
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