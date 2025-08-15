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
  res.cookie("accessToken", accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict", // เพิ่มตัวนี้
    maxAge: 60 * 60 * 1000,
    domain: process.env.FONTEND_MAIN, // เพิ่มตัวนี้
  });


  res.status(200).json({
    success: true,
    statusCode: 200,
    code: 'LOGIN_SUCCESS',
    message: "Login successful"
  });
};