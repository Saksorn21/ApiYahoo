import { User } from "../models/User.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { setSession } from "../redisWrapper.js";

export const authLogin = async (req, res) => {
  const { identifier, password } = req.body;

  if (!identifier || !password) 
    return res.status(400).json({ error: "Username/email and password are required" });

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

  // ใช้ wrapper แทน redis.set ปกติ
  try {
    await setSession(`session:${user._id}`, accessToken, 24 * 60 * 60);
  } catch (err) {
    return res.status(500).json({
      success: false,
      statusCode: 500,
      code: "REDIS_SESSION_FAILED",
      message: "Cannot create session, please try again"
    });
  }

  const isProd = process.env.NODE_ENV === "production";
  res.cookie("accessToken", accessToken, {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? "strict" : "lax",
    maxAge: 60 * 60 * 1000,
    domain: isProd
      ? process.env.COOKIE_SERVICE
      : ".janeway.replit.dev"
  });

  res.status(200).json({
    success: true,
    statusCode: 200,
    code: 'LOGIN_SUCCESS',
    message: "Login successful"
  });
};