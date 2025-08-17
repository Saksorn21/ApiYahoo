import TokenModel from "../../models/Token.js";
import { User } from "../../models/User.js";
import Membership from "../../models/Membership.js";
import LogModel from "../../models/Log.js";
import dayjs from "dayjs"
import redis from "../../redisClient.js"
import mongoose from "mongoose"
export default async function getDashboardInfo() {
  const today = dayjs().startOf("day").toDate();
  const weekAgo = dayjs().subtract(7, "day").toDate();

  const [
    totalUsers,
    totalMemberships,
    totalTokens,
    totalLogs,
    newUsersToday,
    newUsersThisWeek,
    membershipBreakdown
  ] = await Promise.all([
    User.countDocuments(),
    Membership.countDocuments(),
    TokenModel.countDocuments(),
    LogModel.countDocuments(),
    User.countDocuments({ createdAt: { $gte: today } }),
    User.countDocuments({ createdAt: { $gte: weekAgo } }),
    Membership.aggregate([
      { $group: { _id: "$membershipLevel", count: { $sum: 1 } } }
    ])
  ]);

  const redisKeys = await redis.keys("session:*");
  let activeUsers = 0;
  if (redisKeys.length > 0) {
    const ids = redisKeys.map(k => k.split(":")[1]);
    activeUsers = await User.countDocuments({
      _id: { $in: ids.map(id => new mongoose.Types.ObjectId(id)) },
      updatedAt: { $gte: weekAgo }
    });
  }

  return {
    summary: {
      users: totalUsers,
      memberships: totalMemberships,
      tokens: totalTokens,
      logs: totalLogs
    },
    stats: {
      newUsersToday,
      newUsersThisWeek,
      activeUsersLast7Days: activeUsers,
      membershipBreakdown: membershipBreakdown.reduce((acc, m) => {
        acc[m._id] = m.count;
        return acc;
      }, {})
    }
  };
}