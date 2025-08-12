
import bcrypt from "bcrypt";
import { User } from "../models/User.js";
import Membership from "../models/Membership.js"



export const authRegister = async (req, res) => {
  const { username, email, password } = req.body;
  if (!username || !email || !password) return res.status(400).json({
    success: false,
    statusCode: 400,
    code: 'MISSING_FIELDS',
    message: "Missing fields" 
  });

  try {
    const exists = await User.findOne({ 
      $or: [
        { username },
        { email }
      ]
    });

    if (exists) {
      if (exists.username === username) {
        return res.status(409).json({
          success: false,
          statusCode: 409,
          code: 'USERNAME_EXISTS',
          message: "Username already exists" });
      }
      if (exists.email === email) {
        return res.status(409).json({ 
          success: false,
          statusCode: 409,
          code: 'EMAIL_EXISTS',
          message: "Email already exists",
          data: null
        });
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
    res.status(201).json({ 
      success: true,
      statusCode: 201,
      code: 'SIGNUP_SUCCESS',
      message: "Account created successfully", 
      data: {username: user.username }});
  } catch (err) {
    res.status(500).json({
      success: false,
      statusCode: 500,
      code: 'SERVER_ERROR',
      message: 'Internal server error',
      data: {
        message: err.message
      }
      
    });
  }
}
