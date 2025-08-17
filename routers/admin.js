import express from "express";
import TokenModel from "../models/Token.js";
import { User } from "../models/User.js";
import Membership from "../models/Membership.js";
import LogModel from "../models/Log.js";
import { authFromCookie, adminCheck } from "../auth/middleware.js";
import NodeCache from "node-cache";
import getDashboardInfo from "../auth/admin/getDashboardInfo.js"
import { autoComplete } from "../auth/admin/autocomplete.js"
import { getUsers, getTokens, getLogs } from "../auth/admin/getModels.js"
const routerAdmin = express.Router();

const adminCache = new NodeCache({ stdTTL: 3600 }); // TTL = 1 ชั่วโมง
/**
 * @swagger
 * /admin/info:
 *   get:
 *     summary: แสดงข้อมูลสรุปสำหรับ Dashboard Admin
 *     tags: [Admin]
 *     responses:
 *       200:
 *         description: ข้อมูลสถิติสรุป
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 summary:
 *                   type: object
 *                   properties:
 *                     users:
 *                       type: integer
 *                     memberships:
 *                       type: integer
 *                     tokens:
 *                       type: integer
 *                     logs:
 *                       type: integer
 *                 stats:
 *                   type: object
 *                   properties:
 *                     newUsersToday:
 *                       type: integer
 *                     newUsersThisWeek:
 *                       type: integer
 *                     activeUsersLast7Days:
 *                       type: integer
 *                     membershipBreakdown:
 *                       type: object
 *                       additionalProperties:
 *                         type: integer
 *                       example:
 *                         free: 120
 *                         pro: 35
 *                         enterprise: 5
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
  
 routerAdmin.get("/info", authFromCookie, adminCheck, async (req, res) => {
    const cached = adminCache.get("dashboard_info");
    if (cached) return res.json(cached);

    const data = await getDashboardInfo();
    adminCache.set("dashboard_info", data);
    res.json(data);
  });

  // ✅ refresh cache (กดดึงข้อมูลสด)
/**
 * @swagger
 * /admin/info/refresh:
 *   get:
 *     summary: Refresh dashboard summary (ไม่ใช้ cache)
 *     tags: [Admin]
 *     responses:
 *       200:
 *         description: ข้อมูลสรุปล่าสุด (refresh แล้ว cache ใหม่)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 refreshed:
 *                   type: boolean
 *                   example: true
 *                 summary:
 *                   type: object
 *                 stats:
 *                   type: object
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
routerAdmin.get("/info/refresh", authFromCookie, adminCheck, async (req, res) => {
    const data = await getDashboardInfo();
    adminCache.set("dashboard_info", data);
    res.json({ refreshed: true, ...data });
  });
/**
 * @swagger
 * /admin/users:
 *   get:
 *     summary: แสดงผู้ใช้งานและ memberships
 *     tags: [Admin]
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: ค้นหาด้วย prefix ของ username
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: หมายเลขหน้า
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: จำนวนข้อมูลต่อหน้า
 *     responses:
 *       200:
 *         description: รายการผู้ใช้พร้อมข้อมูล membership
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                       username:
 *                         type: string
 *                       email:
 *                         type: string
 *                       role:
 *                         type: string
 *                         enum: [user, admin]
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                       updatedAt:
 *                         type: string
 *                         format: date-time
 *                       membership:
 *                         type: object
 *                         properties:
 *                           _id:
 *                             type: string
 *                           membershipLevel:
 *                             type: string
 *                             enum: [free, pro, enterprise]
 *                           apiRequestCount:
 *                             type: number
 *                           apiRequestReset:
 *                             type: string
 *                             format: date-time
 *                           createdAt:
 *                             type: string
 *                             format: date-time
 *                           updatedAt:
 *                             type: string
 *                             format: date-time
 *                 total:
 *                   type: integer
 *                 page:
 *                   type: integer
 *                 pages:
 *                   type: integer
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
// แสดงผู้ใช้งานแชะ memberships
routerAdmin.get("/users", authFromCookie, adminCheck, getUsers);

/**
 * @swagger
 * /admin/autocomplete:
 *   get:
 *     summary: Autocomplete username for users, tokens, or logs
 *     tags: [Admin]
 *     parameters:
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [users, tokens, logs]
 *         required: true
 *         description: Type of autocomplete search
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         required: true
 *         description: Search keyword (prefix match)
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         required: false
 *         description: Maximum number of results (default 5)
 *     responses:
 *       200:
 *         description: List of matching usernames
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: string
 *                 example: "boat123"
 *       400:
 *         description: Invalid type parameter
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Invalid type"
 */
routerAdmin.get(
  "/users/autocomplete",
  authFromCookie,
  adminCheck,
  autoComplete
);
/**
 * @swagger
 * /admin/users/{id}:
 *   put:
 *     summary: แก้ไขข้อมูลผู้ใช้งาน
 *     tags: [Admin]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ObjectId ของผู้ใช้
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *               email:
 *                 type: string
 *               role:
 *                 type: string
 *                 enum: [user, admin]
 *     responses:
 *       200:
 *         description: ข้อมูลผู้ใช้งานที่แก้ไขแล้ว
 *         content:
 *           application/json:
 *             example:
 *               _id: "64dfb9d92d1b8c2f3b4f5678"
 *               username: "Boat"
 *               email: "boat@example.com"
 *               role: "admin"
 *               createdAt: "2025-08-12T07:25:12.123Z"
 *               updatedAt: "2025-08-12T07:40:00.456Z"
 *       404:
 *         description: ไม่พบผู้ใช้งาน
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *
 *   delete:
 *     summary: ลบผู้ใช้งานและ membership ที่เกี่ยวข้อง
 *     tags: [Admin]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ObjectId ของผู้ใช้
 *     responses:
 *       200:
 *         description: ลบสำเร็จ
 *         content:
 *           application/json:
 *             example:
 *               message: "User and membership deleted successfully"
 *       404:
 *         description: ไม่พบผู้ใช้งาน
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */

/**
 * @swagger
 * /admin/memberships/{userId}:
 *   put:
 *     summary: แก้ไขข้อมูล membership
 *     tags: [Admin]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: ObjectId ของผู้ใช้
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               membershipLevel:
 *                 type: string
 *                 enum: [free, pro, enterprise]
 *               apiRequestCount:
 *                 type: integer
 *               apiRequestReset:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       200:
 *         description: ข้อมูล membership ที่แก้ไขแล้ว
 *         content:
 *           application/json:
 *             example:
 *               _id: "750aa3a12f9b6c1234567890"
 *               userId: "64dfb9d92d1b8c2f3b4f5678"
 *               membershipLevel: "pro"
 *               apiRequestCount: 120
 *               apiRequestReset: "2025-09-01T00:00:00.000Z"
 *               createdAt: "2025-08-01T07:00:00.000Z"
 *               updatedAt: "2025-08-12T08:00:00.000Z"
 *       404:
 *         description: ไม่พบ membership
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
// แก้ไขข้อมูลผู้ใช้งาน
routerAdmin.put("/users/:id", authFromCookie, adminCheck, async (req, res) => {
  try {
    const { username, email, role } = req.body;

    // อัปเดตเฉพาะฟิลด์ที่ส่งมา
    const updateFields = {};
    if (username) updateFields.username = username;
    if (email) updateFields.email = email;
    if (role) updateFields.role = role;

    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      updateFields,
      { new: true, runValidators: true },
    ).select("-password -__v");

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        statusCode: 404,
        code: "USER_NOT_FOUND",
        message: "User not found",
        data: null,
        error: null,
      });
    }

    res.json({
      success: true,
      statusCode: 200,
      code: "UPDATE_USER_SUCCESS",
      message: "Update user successful",
      data: updatedUser,
      error: null,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ลบผู้ใช้งาน (และลบ membership ที่เกี่ยวข้องด้วย)
routerAdmin.delete(
  "/users/:id",
  authFromCookie,
  adminCheck,
  async (req, res) => {
    try {
      const deletedUser = await User.findByIdAndDelete(req.params.id);

      if (!deletedUser) {
        return res.status(404).json({
          success: false,
          statusCode: 404,
          code: "USER_NOT_FOUND",
          message: "User not found",
          data: null,
          error: null,
        });
      }

      // ลบ membership ที่ผูกกับ user
      await Membership.findOneAndDelete({ userId: req.params.id });

      res.json({
        success: true,
        statusCode: 200,
        code: "DELETE_USER_SUCCESS",
        message: "User and membership deleted successfully",
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },
);

// แก้ไขข้อมูล membership
routerAdmin.put(
  "/memberships/:userId",
  authFromCookie,
  adminCheck,
  async (req, res) => {
    try {
      const { membershipLevel, apiRequestCount, apiRequestReset } = req.body;

      const updateFields = {};
      if (membershipLevel) updateFields.membershipLevel = membershipLevel;
      if (typeof apiRequestCount === "number")
        updateFields.apiRequestCount = apiRequestCount;
      if (apiRequestReset)
        updateFields.apiRequestReset = new Date(apiRequestReset);

      const updatedMembership = await Membership.findOneAndUpdate(
        { userId: req.params.userId },
        updateFields,
        { new: true, runValidators: true },
      ).select("-__v");

      if (!updatedMembership) {
        return res.status(404).json({ error: "Membership not found" });
      }

      res.json(updatedMembership);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },
);

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
routerAdmin.delete(
  "/token/:id",
  authFromCookie,
  adminCheck,
  async (req, res) => {
    const { id } = req.params;
    await TokenModel.findByIdAndDelete(id);
    res.json({ message: "Token revoked" });
  },
);

/**
 * @swagger
 * /admin/tokens:
 *   get:
 *     summary: Get all tokens with username
 *     tags: [Admin]
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         required: false
 *         description: Search by user
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Items per page
 *     responses:
 *       200:
 *         description: List of tokens
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       token:
 *                         type: string
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                       expiresAt:
 *                         type: string
 *                         format: date-time
 *                       user:
 *                         type: object
 *                         properties:
 *                           username:
 *                             type: string
 *                 total:
 *                   type: integer
 *                 page:
 *                   type: integer
 *                 pages:
 *                   type: integer
 */
routerAdmin.get("/tokens", authFromCookie, adminCheck, getTokens);
/**
 * @swagger
 * /admin/logs:
 *   get:
 *     summary: Get system logs
 *     tags: [Admin]
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         required: false
 *         description: Search by user, action, endpoint, method, or IP
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         required: false
 *         description: Page number (optional, ignored if not provided)
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         required: false
 *         description: Number of logs per page (optional, ignored if not provided)
 *     responses:
 *       200:
 *         description: List of logs
 */
routerAdmin.get("/logs", authFromCookie, adminCheck, getLogs);

export default routerAdmin;
