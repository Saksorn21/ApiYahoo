import TokenModel from "../../models/Token.js";
import { User } from "../../models/User.js";
import Membership from "../../models/Membership.js";
import LogModel from "../../models/Log.js";
import dayjs from "dayjs"
import redis from "../../redisClient.js"
import mongoose from "mongoose"

export const autoComplete = async (req, res) => {
  const type = req.query.type || "users";

  let results;
  switch(type) {
    case "users":
      results = await autoUsers(req);
      break;
    case "tokens":
      results = await autoTokensUsers(req);
      break;
    case "logs":
      results = await autoLogsUsers(req);
      break;
    default:
      return res.status(400).json({ error: "Invalid type" });
  }

  res.json(results);
};
const autoUsers = async (req) => {
    const search = req.query.search || "";
    const limit = parseInt(req.query.limit) || 5;

    if (!search) return res.json([]); // ถ้าไม่มี search ก็ไม่ต้องส่งอะไร

    const users = await User.aggregate([
      {
        $match: { username: { $regex: "^" + search, $options: "i" } },
      },
      {
        $project: { username: 1, _id: 0 }, // ส่งเฉพาะ field ที่ต้องใช้
      },
      { $sort: { username: 1 } },
      { $limit: limit },
    ]);

   return users.map((u) => u.username)
  }
export const autoTokensUsers = async (req) => {
  const search = req.query.search || "";
  const limit = parseInt(req.query.limit) || 5;

  if (!search) return res.json([]);

  const tokens = await TokenModel.aggregate([
    {
      $lookup: {
        from: "users",
        localField: "userId",
        foreignField: "_id",
        as: "user",
      },
    },
    { $unwind: "$user" },
    {
      $match: { "user.username": { $regex: "^" + search, $options: "i" } },
    },
    {
      $project: { username: "$user.username" },
    },
    { $sort: { username: 1 } },
    { $limit: limit },
  ]);

  return tokens.map(t => t.username)
};
export const autoLogsUsers = async (req) => {
  const search = req.query.search || "";
  const limit = parseInt(req.query.limit) || 5;

  if (!search) return res.json([]);

  const logs = await LogModel.aggregate([
    {
      $match: { user: { $regex: "^" + search, $options: "i" } },
    },
    { $project: { username: "$user" } },
    { $sort: { username: 1 } },
    { $limit: limit },
  ]);

  return logs.map(l => l.username)
};