import { User } from "../models/User.js";
import Membership from "../models/Membership.js";
import logger from "../utils/logger.js";

const getMe = async (req, res) => {
  try {
    const userId = req.user._id;

    const result = await User.aggregate([
      { $match: { _id: userId } },
      {
        $lookup: {
          from: "memberships",
          localField: "_id",
          foreignField: "userId",
          as: "membershipArr"
        }
      },
      { $unwind: { path: "$membershipArr", preserveNullAndEmptyArrays: true } },
      { $project: { password: 0, __v: 0, "membershipArr.__v": 0 } }
    ]);

    const userWithMembership = result[0] || null;

    if (!userWithMembership) {
      return res.status(404).json({
        success: false,
        statusCode: 404,
        code: 'GET_ME_FAILED',
        message: "User not found",
        data: null
      });
    }

    // เปลี่ยนชื่อ field จาก membershipArr → membership
    const { membershipArr, ...userData } = userWithMembership;
    userData.membership = membershipArr || null;

    res.json({
      success: true,
      statusCode: 200,
      code: 'GET_ME_SUCCESS',
      message: "Get me successful",
      data: userData
    });

  } catch (error) {
    logger.debug("GetMe Error: ", error);
    res.status(500).json({
      success: false,
      statusCode: 500,
      code: 'GET_ME_FAILED',
      message: "Get me failed",
      data: null
    });
  }
}

export default getMe;