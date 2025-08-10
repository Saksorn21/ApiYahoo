import express from "express";
import jwt from "jsonwebtoken";
import TokenModel from "../models/Token.js";
import { User } from "../models/User.js"

// ตรวจสอบ refresh token และสร้าง access token ใหม่ สำหละบ Bearer API
export const refreshToken = async (req, res) => {
  const { apiToken } = req.body;
  if (!apiToken) return res.status(400).json({ error: "No API token" });

  try {
    // 1. หา refresh token ใน DB
    const storedToken = await TokenModel.findOne({ refreshToken: apiToken });
    if (!storedToken) return res.status(403).json({ error: "Invalid refresh token" });
    const storedUser = await User.findOne({ username: storedToken.user })
    // 2. เช็กหมดอายุ
    const now = new Date();
    if (storedToken.expiresAt < now) {
      return res.status(403).json({ error: "Refresh token expired" });
    }
    now.setDate(now.getDate() + 7);
    // 3. Verify ตัว refreshToken ด้วย secret
    const payload = jwt.verify(refreshToken, process.env.JWT_SECRET);

    // 4. สร้าง access token ใหม่
    const accessToken = jwt.sign(
      { id: storedUser._id },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES }
    );
storedToken.set({ refreshToken: accessToken, expiresAt: now })
    await storedToken.save()
    res.json({ apiToken: accessToken });
  } catch (err) {
    console.error("Refresh error:", err);
    res.status(403).json({ error: "Token error" });
  }
}

