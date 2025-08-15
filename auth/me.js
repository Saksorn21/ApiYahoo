import { User } from "../models/User.js"
const getMe = async (req, res) => {
  try {
  
  const user = await User.findById(res.user._id).select("-password -__v").lean()
  res.json({
    success: true,
    statusCode: 200,
    code: 'GET_ME_SUCCESS',
    message: "Get me successful",
    data: user
  })
    } catch (error) {
      res.status(500).json({
        success: false,
        statusCode: 500,
        code: 'GET_ME_FAILED',
        message: "Get me failed",
        data: null
      })
    }
}
export default getMe