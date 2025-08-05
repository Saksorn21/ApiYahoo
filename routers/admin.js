import express from "express";
import TokenModel from "../models/Token.js";
import LogModel from "../models/Log.js";
import { authenticateToken } from "./middleware.js";
import { adminCheck } from "./admin.js";

const router = express.Router();

// ✅ ดู token ทั้งหมด
router.get("/tokens", authenticateToken, adminCheck, async (req, res) => {
  const tokens = await TokenModel.find().select("-__v");
  res.json(tokens);
});

// ✅ ลบ token by id
router.delete("/token/:id", authenticateToken, adminCheck, async (req, res) => {
  const { id } = req.params;
  await TokenModel.findByIdAndDelete(id);
  res.json({ message: "Token revoked" });
});

// ✅ ดู log ล่าสุด
router.get("/logs", authenticateToken, adminCheck, async (req, res) => {
  const logs = await LogModel.find().sort({ createdAt: -1 }).limit(100);
  res.json(logs);
});

export default router;