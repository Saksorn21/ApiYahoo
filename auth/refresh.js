import express from "express";
import jwt from "jsonwebtoken";
import TokenModel from "../models/Token.js";



export const refreshToken = async (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) return res.status(400).json({ error: "No refresh token" });

  try {
    // 1. หา refresh token ใน DB
    const storedToken = await TokenModel.findOne({ refreshToken });
    if (!storedToken) return res.status(403).json({ error: "Invalid refresh token" });

    // 2. เช็กหมดอายุ
    const now = new Date();
    if (storedToken.expiresAt < now) {
      return res.status(403).json({ error: "Refresh token expired" });
    }

    // 3. Verify ตัว refreshToken ด้วย secret
    const payload = jwt.verify(refreshToken, process.env.JWT_SECRET);

    // 4. สร้าง access token ใหม่
    const accessToken = jwt.sign(
      { user: payload.user },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES }
    );

    res.json({ accessToken });
  } catch (err) {
    console.error("Refresh error:", err);
    res.status(403).json({ error: "Token error" });
  }
}

