import express from "express";
import jwt from "jsonwebtoken";
import TokenModel from "../models/Token.js";

const router = express.Router();

export const login = async (req, res) => {
  const { username, password } = req.body;
console.log("[LOGIN] ")
  // ✅ Mock user check (Boat เพิ่ม DB ได้ทีหลัง)
  if (username !== "boat" || password !== "1234") {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  // 🛡 สร้าง JWT Token
  const accessToken = jwt.sign(
    { user: username },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES }
  );

  // 🛡 สร้าง Refresh Token
  const refreshToken = jwt.sign(
    { user: username },
    process.env.JWT_SECRET,
    { expiresIn: process.env.REFRESH_EXPIRES }
  );

  // 🗃 เก็บ refreshToken ลง Mongo
  const expiryDate = new Date();
  expiryDate.setSeconds(expiryDate.getSeconds() + 7 * 24 * 60 * 60); // 7 วัน
  try{
  await TokenModel.create({
    user: username,
    refreshToken,
    expiresAt: expiryDate
  });
}catch(err){
    console.error("🔥 MongoDB error:", err)
}
  // ✅ ส่งคืนให้ client
  res.json({ accessToken, refreshToken });
}

