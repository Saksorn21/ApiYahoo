import { User } from "../models/User.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import TokenModel from "../models/Token.js";

export const authLogin = async (req, res) => {
  const { username, password } = req.body;
  const user = await User.findOne({ username });
  if (!user) return res.status(401).json({ error: "Invalid credentials" });

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) return res.status(401).json({ error: "Invalid credentials" });

  // สร้าง token ตามเดิม (ใช้ user.username, user.role)
  const accessToken = jwt.sign(
    { id: user._id },
    process.env.JWT_LOGIN_SECRET,
    { expiresIn: process.env.JWT_EXPIRES }
  );
  res.cookie("accessToken", accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production", // ใช้ https เท่านั้น
    maxAge: 60 * 60 * 1000  // 1 ชม.
  })
  const refreshToken = jwt.sign(
    { user: user.username, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.REFRESH_EXPIRES }
  );

  const expiryDate = new Date();
  expiryDate.setDate(expiryDate.getDate() + 7);
  //await TokenModel.create({
   // user: user.username,
   // refreshToken,
  //  expiresAt: expiryDate
  //});

  res.json({ accessToken, refreshToken });
}