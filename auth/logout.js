import redis from "../redisClient.js";
import logger from "../utils/logger.js"
export async function authLogout(req, res) {
  try {
  
  if (!res.user) return res.status(401).json({ error: "Not logged in" });

  // ลบ session ใน Redis
  await redis.del(`session:${req.user._id}`);

  // ลบ cookie
  res.clearCookie("accessToken");

  res.status(200).json({
    success: true, 
    statusCode: 200,
    code: 'LOGOUT_SUCCESS',
    message: "Logged out successfully"
  });
    } catch (err) {
    logger.debug("Logout Error: ", err)
    console.error("Logout error:", err.message)
res.status(500).json({
    success: false,
    statusCode: 500,
    code: 'INTERNAL_SERVER_ERROR',
    message: "Internal server error"
}
)
    }
}