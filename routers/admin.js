import express from "express";
import TokenModel from "../models/Token.js";
import LogModel from "../models/Log.js";
import { authFromCookie, adminCheck } from "../auth/middleware.js";

const router = express.Router();

/**
 * @swagger
 * /admin/tokens:
 *   get:
 *     summary: get all tokens
 *     tags: [Admin]
 *     responses:
 *       200:
 *         description: OK
 */
router.get("/tokens", authFromCookie, adminCheck, async (req, res) => {
  const tokens = await TokenModel.find().select("-__v");
  res.json(tokens);
});


/**
 * @swagger
 * /admin/token/{id}:
 *   delete:
 *     summary: Delete token by ID
 *     tags: [Admin]
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: Token ID
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: OK
 *       404:
 *         description: Token not found
 */
router.delete("/token/:id", authFromCookie, adminCheck, async (req, res) => {
  const { id } = req.params;
  await TokenModel.findByIdAndDelete(id);
  res.json({ message: "Token revoked" });
});

/**
 * @swagger
 * /admin/logs:
 *   get:
 *     summary: Get logs
 *     tags: [Admin]
 *     responses:
 *       200:
 *         description: OK
 */
router.get("/logs", authFromCookie, adminCheck, async (req, res) => {
  const logs = await LogModel.find().sort({ createdAt: -1 }).limit(100);
  res.json(logs);
});

export default router;