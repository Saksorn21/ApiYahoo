
import bcrypt from "bcrypt";
import { User } from "../models/User.js";



export const authRegister = async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: "Missing fields" });

  try {
    const exists = await User.findOne({ username });
    if (exists) return res.status(409).json({ error: "Username taken" });

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({ username, password: passwordHash });

    res.json({ message: "User created", user: user.username });
  } catch (err) {
    res.status(500).json({ error: "Registration error",
                         message: err.message});
  }
}
