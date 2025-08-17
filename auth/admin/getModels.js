import TokenModel from "../../models/Token.js";
import { User } from "../../models/User.js";
import Membership from "../../models/Membership.js";
import LogModel from "../../models/Log.js";

export const getUsers = async (req, res) => {
  const search = req.query.search || "";
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  const pipeline = [
    {
      $match: {
        username: { $regex: "^" + search, $options: "i" },
      },
    },
    {
      $lookup: {
        from: "memberships",
        localField: "_id",
        foreignField: "userId",
        as: "membership",
      },
    },
    { $unwind: { path: "$membership", preserveNullAndEmptyArrays: true } },
    { $project: { password: 0, __v: 0, "membership.__v": 0 } },
    {
      $facet: {
        data: [{ $sort: { username: 1 } }, { $skip: skip }, { $limit: limit }],
        totalCount: [{ $count: "count" }],
      },
    },
  ];

  const result = await User.aggregate(pipeline);
  const usersWithMemberships = result[0].data;
  const total = result[0].totalCount[0]?.count || 0;

  res.json({
    data: usersWithMemberships,
    total,
    page,
    pages: Math.ceil(total / limit),
  });
}
export const getTokens = async (req, res) => {
  const search = req.query.search || "";
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  const pipeline = [
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
      $match: {
        "user.username": { $regex: "^" + search, $options: "i" },
      },
    },
    {
      $project: {
        __v: 0,
        userId: 0,
        "user._id": 0,
        "user.email": 0,
        "user.password": 0,
        "user.role": 0,
        "user.__v": 0,
        "user.createdAt": 0,
        "user.updatedAt": 0,
      },
    },
    {
      $facet: {
        data: [{ $sort: { createdAt: -1 } }, { $skip: skip }, { $limit: limit }],
        totalCount: [{ $count: "count" }],
      },
    },
  ];

  const result = await TokenModel.aggregate(pipeline);
  const data = result[0].data.map(t => ({
    ...t,
    username: t.user?.username || null
  }));
  const total = result[0].totalCount[0]?.count || 0;

  res.json({
    data,
    total,
    page,
    pages: Math.ceil(total / limit),
  });
};
export const getLogs = async (req, res) => {
  const page = req.query.page ? parseInt(req.query.page) : null;
  const limit = req.query.limit ? parseInt(req.query.limit) : null;
  const skip = page && limit ? (page - 1) * limit : 0;
  const search = req.query.search || null;

  // filter เงื่อนไข search
  const filter = search
    ? {
        $or: [
          { user: { $regex: search, $options: "i" } },
          { action: { $regex: search, $options: "i" } },
          { endpoint: { $regex: search, $options: "i" } },
          { method: { $regex: search, $options: "i" } },
          { ip: { $regex: search, $options: "i" } },
        ],
      }
    : {};

  let query = LogModel.find(filter).sort({ timestamp: -1 });

  if (page && limit) {
    query = query.skip(skip).limit(limit);
  }

  const logs = await query.exec();
  const total = await LogModel.countDocuments(filter);

  res.json({
    data: logs,
    total,
    page: page || 1,
    pages: limit ? Math.ceil(total / limit) : 1,
  });
};