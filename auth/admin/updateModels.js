import TokenModel from "../../models/Token.js";
import { User } from "../../models/User.js";
import Membership from "../../models/Membership.js";
import LogModel from "../../models/Log.js";
import dayjs from "dayjs"
import logger from "../../utils/logger.js"

export const updateUser = async (req, res) => {
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
  }
export const updateMembership = async (req, res) => {
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
  }
export const updateToken = async (req, res) =>{
    const { id } = req.params
    const { expiresIn } = req.body
  const EXPIRE_OPTIONS = { "1d": 1, "7d": 7, "30d": 30, "1y": 365 };
    if(!expiresIn) return res.status(400).json({ error: "Invalid expiresIn value"})
    const days = EXPIRE_OPTIONS[expiresIn] || 7
    const expireDate = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
  try {
  
    const token = await TokenModel.findByIdAndUpdate(id,{
        expiresAt: expireDate
    }, { new: true, runValidators: true },
      ).select("-refreshToken -apiToken -__v"))
    if(!token) return res.status(404).json({ error: "Token not found"})
    } catch (err) {
        console.error("server error: ", err.message)
    res.status(500).json({ error: "Internal server error"})
    }
  
    res.json({ message: `Token updated successfully`})
}