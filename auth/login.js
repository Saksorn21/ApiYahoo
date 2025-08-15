import { User } from "../models/User.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import redis from "../redisClient.js";
export const authLogin = async (req, res) => {
  const { identifier, password } = req.body; // เปลี่ยนเป็น identifier ครอบคลุมทั้ง email หรือ username

  if (!identifier || !password) 
    return res.status(400).json({ error: "Username/email and password are required" });

  // หา user โดยเช็ค identifier ว่า match email หรือ username
  const user = await User.findOne({
    $or: [{ email: identifier }, { username: identifier }],
  });

  if (!user) 
    return res.status(401).json({
      success: false,
      statusCode: 401,
      code: 'INVALID_CREDENTIALS',
      message: "Invalid username or email"
    });

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) 
    return res.status(401).json({ 
      success: false,
      statusCode: 401,
      code: 'INVALID_PASSWORD',
      message: "Password is incorrect" 
    });

  const accessToken = jwt.sign(
    { id: user._id },
    process.env.JWT_LOGIN_SECRET,
    { expiresIn: process.env.JWT_EXPIRES }
  );

  await redis.set(`session:${user._id}`, accessToken, "EX", 24 * 60 * 60);

  // ใน login controller
  const isProd = process.env.NODE_ENV === "production";

  res.cookie("accessToken", accessToken, {
    httpOnly: true,
    secure: isProd, // ใช้ secure เฉพาะ prod
    sameSite: isProd ? "strict" : "lax", // dev ใช้ lax จะง่ายกว่าเวลา cross-site
    maxAge: 60 * 60 * 1000,
    domain: isProd
      ? process.env.SERVER_BACKEND // ใช้ได้ทั้ง api.example.com และ app.example.com
      : "44c550b7-54f4-4174-bd1d-c51ff1e4f8c8-00-1wilq50r88xfl.janeway.replit.dev" // dev ใช้ localhost
  });


  res.status(200).json({
    success: true,
    statusCode: 200,
    code: 'LOGIN_SUCCESS',
    message: "Login successful"
  });
};