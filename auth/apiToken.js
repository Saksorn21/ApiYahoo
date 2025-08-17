
import jwt from "jsonwebtoken";
import TokenModel from "../models/Token.js"
import { User } from "../models/User.js"
import crypto from "node:crypto"
import logger from "../utils/logger.js"
const generateApiToken = (size = 48) => crypto.randomBytes(size).toString("base64url")

// /auth/api-token
export const getApiToken = async (req, res) => {
  try {
  // สร้าง bearer token สำหรับ API Yahoo Finance
  const EXPIRE_OPTIONS = { "1d": 1, "7d": 7, "30d": 30, "1y": 365 };
  const expiresIn = req.body.expiresIn;
    if(!expiresIn) return res.status(400).json({ error: "Missing expiresIn"})
  // ส่งมาจาก middleware ตรวจสอบ cookie access token
  const username = req.user.username
    if(!username) return res.status(400).json({
      success: false,
      statusCode: 400,
      code: 'MISSING_FIELDS',
      message: "Missing fields"
      
    })
    logger.debug("getApiToken user:", username)
const dataToken = await TokenModel.findOne({ user: username}).lean()
  // ถ้ามี ข้อมูล token และยังไม่หมดแายุ ส่งกลับไป
    if (dataToken && dataToken.expiresAt > new Date()) return res.json({ apiToken: dataToken.apiToken });
  // ถ้ามี แตืหมดอายุ ให้ลบออก
  if(dataToken && dataToken.expiresAt < new Date()){
    await TokenModel.deleteOne({ user: username})
   return res.status(403).json({ error: "Token expired"})
  }
  //ไม่มี token ให้สร้างใหม่
  const user = await User.findOne({ username }).lean();
  if (!user) return res.status(404).json({ error: "User not found" });
  const days = EXPIRE_OPTIONS[expiresIn] || 7; // default 7 วันถ้าไม่มีหรือผิด format

  const expireDate = new Date(Date.now() + days * 24 * 60 * 60 * 1000);

  const apiToken = generateApiToken();
  // สร้าง jwt token แยกจาก access token เพื่อใช้สำหรับ API
    let refreshToken
    try{
   refreshToken = jwt.sign(
    { id: user._id },
    process.env.JWT_SECRET,
    { expiresIn: process.env.REFRESH_EXPIRES }
  );
      } catch (err){
        logger.debug("api-token JWT error: ", err)
      }

  await TokenModel.create({
    user: user.username,
    refreshToken,
    apiToken,
    expiresAt: expireDate
  });
  
res.json({ apiToken })
    } catch (error) {
    logger.debug("/api-token error: ", error)
    console.error(error)
    res.status(500).json({ error: "Internal server error" });
    }

}