
import jwt from "jsonwebtoken";


export const getApiToken = (req, res) => {
  const apiToken = jwt.sign(
    { user: req.user.user, role: req.user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_API_EXPIRES }
  );

  res.json({ apiToken });
}