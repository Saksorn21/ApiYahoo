import TokenModel from "../../models/Token.js";
import { User } from "../../models/User.js";
import Membership from "../../models/Membership.js";
import LogModel from "../../models/Log.js";
import dayjs from "dayjs"
import logger from "../../utils/logger.js"

const deleteUserWithMembership = async (req, res) => {
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
  }

const deleteToken =  async (req, res) => {
    const { id } = req.params;
    await TokenModel.findByIdAndDelete(id);
    res.json({ message: "Token revoked" });
}

import Log from "../models/logs.js";

export const deleteLogs = async (req, res) => {
  try {
    const { month, method, user } = req.query;

    // ===== Validate month =====
    if (!month || !/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) {
      return res.status(400).json({ error: "Invalid month format (must be YYYY-MM)" });
    }

    // ===== Setup time range =====
    const [year, startMonth] = month.split("-").map(Number);
    const startDate = new Date(year, startMonth - 1, 1);

    const now = new Date();
    const nowMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

    const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    // ===== Build filter =====
    const filter = { createdAt: { $gte: startDate, $lte: endDate } };

    if (method) {
      const methods = method.split(",").map((m) => m.trim().toUpperCase());
      filter.method = { $in: methods };
    }

    if (user) {
      filter.user = user;
    }

    // ===== Count & Delete =====
    const count = await Log.countDocuments(filter);
    await Log.deleteMany(filter);

    // ===== Response =====
    return res.status(200).json({
      month,
      nowMonth,
      range: `${month} to ${nowMonth}`,
      methods: method ? method.split(",").map((m) => m.trim().toUpperCase()) : ["All"],
      users: user || "All",
      count,
      message: "Logs deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting logs:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};