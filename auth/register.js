
import bcrypt from "bcrypt";
import { User } from "../models/User.js";
import Membership from "../models/Membership.js"



export const authRegister = async (req, res) => {
  const { username, email, password } = req.body;
  if (!username || !email || !password) return res.status(400).json({ error: "Missing fields" });

  try {
    const exists = await User.findOne({ 
      $or: [
        { username },
        { email }
      ]
    });

    if (exists) {
      if (exists.username === username) {
        return res.status(409).json({ error: "Username taken" });
      }
      if (exists.email === email) {
        return res.status(409).json({ error: "Email taken" });
      }
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({ username, email,  password: passwordHash });
    
    const membership = new Membership({
      userId: user._id,
      membershipLevel: "free",  // default level
      apiRequestCount: 0,
      apiRequestReset: new Date(), // reset ตอนสมัคร
    });
    await membership.save();
    res.json({ message: "User created", user: user.username });
  } catch (err) {
    res.status(500).json({ error: "Registration error",
                         message: err.message});
  }
}
