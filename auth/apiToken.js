
import jwt from "jsonwebtoken";
import TokenModel from "../models/Token.js"
import { User } from "../models/User.js"

export const getApiToken = async (req, res) => {
  // สร้าง token สำหรับ API Yahoo Finance
const dataToken = await TokenModel.findOne({ user: req.user})
  if (dataToken) return res.json({ apiToken: dataToken.refreshToken });
  const user = await User.findOne({ username: req.user })
  const refreshToken = jwt.sign(
    { id: user._id },
    process.env.JWT_SECRET,
    { expiresIn: process.env.REFRESH_EXPIRES }
  );

  const expiryDate = new Date();
  expiryDate.setDate(expiryDate.getDate() + 7);
  await TokenModel.create({
    user: user.username,
    refreshToken,
    expiresAt: expiryDate
  });
  

  
}