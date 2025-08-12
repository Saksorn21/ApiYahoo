import express from "express";
import TokenModel from "../models/Token.js";
import { User } from "../models/User.js"
import Membership from "../models/Membership.js"
import LogModel from "../models/Log.js";
import { authFromCookie, adminCheck } from "../auth/middleware.js";

const routerAdmin = express.Router();
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
 *                 usersWithMemberships:
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
 *                       membershipLevel:
 *                         type: string
 *                       apiRequestCount:
 *                         type: number
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
routerAdmin.get("/users", authFromCookie, adminCheck, async (req, res) => {
  const search = req.query.search || "";
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  const pipeline = [
    { 
      $match: { 
        username: { $regex: "^" + search, $options: "i" }
      } 
    },
    {
      $lookup: {
        from: "memberships",
        localField: "_id",
        foreignField: "userId",
        as: "membership"
      }
    },
    { $unwind: { path: "$membership", preserveNullAndEmptyArrays: true } },
    { $project: { password: 0, __v: 0, "membership.__v": 0 } },
    {
      $facet: {
        data: [
          { $sort: { username: 1 } },
          { $skip: skip },
          { $limit: limit }
        ],
        totalCount: [
          { $count: "count" }
        ]
      }
    }
  ];

  const result = await User.aggregate(pipeline);
  const usersWithMemberships = result[0].data;
  const total = result[0].totalCount[0]?.count || 0;

  res.json({
    usersWithMemberships,
    total,
    page,
    pages: Math.ceil(total / limit)
  });
});

/**
 * @swagger
 * /admin/users/autocomplete:
 *   get:
 *     summary: Auto-complete ค้นหาผู้ใช้ (prefix search)
 *     tags: [Admin]
 *     parameters:
 *       - in: query
 *         name: search
 *         required: true
 *         schema:
 *           type: string
 *         description: คำค้นหา (prefix) เช่น 'b'
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 5
 *         description: จำนวนผลลัพธ์สูงสุด
 *     responses:
 *       200:
 *         description: รายชื่อ username ที่ match
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: string
 *                 example: boat
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
routerAdmin.get("/users/autocomplete", authFromCookie, adminCheck, async (req, res) => {
  const search = req.query.search || "";
  const limit = parseInt(req.query.limit) || 5;

  if (!search) return res.json([]); // ถ้าไม่มี search ก็ไม่ต้องส่งอะไร

  const users = await User.aggregate([
    { 
      $match: { username: { $regex: "^" + search, $options: "i" } }
    },
    { 
      $project: { username: 1, _id: 0 } // ส่งเฉพาะ field ที่ต้องใช้
    },
    { $sort: { username: 1 } },
    { $limit: limit }
  ]);

  res.json(users.map(u => u.username));
});
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
 *
 *   delete:
 *     summary: ลบ membership
 *     tags: [Admin]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: ObjectId ของผู้ใช้
 *     responses:
 *       200:
 *         description: ลบ membership สำเร็จ
 *         content:
 *           application/json:
 *             example:
 *               message: "Membership deleted successfully"
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
      { new: true, runValidators: true }
    ).select("-password -__v");

    if (!updatedUser) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json(updatedUser);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ลบผู้ใช้งาน (และลบ membership ที่เกี่ยวข้องด้วย)
routerAdmin.delete("/users/:id", authFromCookie, adminCheck, async (req, res) => {
  try {
    const deletedUser = await User.findByIdAndDelete(req.params.id);

    if (!deletedUser) {
      return res.status(404).json({ error: "User not found" });
    }

    // ลบ membership ที่ผูกกับ user
    await Membership.findOneAndDelete({ userId: req.params.id });

    res.json({ message: "User and membership deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// แก้ไขข้อมูล membership
routerAdmin.put("/memberships/:userId", authFromCookie, adminCheck, async (req, res) => {
  try {
    const { membershipLevel, apiRequestCount, apiRequestReset } = req.body;

    const updateFields = {};
    if (membershipLevel) updateFields.membershipLevel = membershipLevel;
    if (typeof apiRequestCount === "number") updateFields.apiRequestCount = apiRequestCount;
    if (apiRequestReset) updateFields.apiRequestReset = new Date(apiRequestReset);

    const updatedMembership = await Membership.findOneAndUpdate(
      { userId: req.params.userId },
      updateFields,
      { new: true, runValidators: true }
    ).select("-__v");

    if (!updatedMembership) {
      return res.status(404).json({ error: "Membership not found" });
    }

    res.json(updatedMembership);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ลบ membership
routerAdmin.delete("/memberships/:userId", authFromCookie, adminCheck, async (req, res) => {
  try {
    const deletedMembership = await Membership.findOneAndDelete({ userId: req.params.userId });

    if (!deletedMembership) {
      return res.status(404).json({ error: "Membership not found" });
    }

    res.json({ message: "Membership deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
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
  routerAdmin.get("/tokens", authFromCookie, adminCheck, async (req, res) => {
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
  routerAdmin.delete("/token/:id", authFromCookie, adminCheck, async (req, res) => {
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
  routerAdmin.get("/logs", authFromCookie, adminCheck, async (req, res) => {
  const logs = await LogModel.find().sort({ createdAt: -1 }).limit(100);
  res.json(logs);
});

export default routerAdmin;