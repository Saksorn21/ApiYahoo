
import jwt from "jsonwebtoken";
import TokenModel from "../models/Token.js"
import { User} from "../models/User.js"

export const getApiToken = async (req, res) => {
  // สร้าง token สำหรับ API Yahoo Finance
const dataToken = await TokenModel.findOne({ user: req.user})
  const apiToken = jwt.sign(
    { user: req.user.username, role: req.user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES }
  );

  res.json({ apiToken: dataToken.refreshToken });
}