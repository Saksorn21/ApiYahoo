import redis from "../redisClient.js";

export async function authLogout(req, res) {
  if (!req.user) return res.status(401).json({ error: "Not logged in" });

  // ลบ session ใน Redis
  await redis.del(`session:${req.user.id}`);

  // ลบ cookie
  res.clearCookie("accessToken");

  res.status(200).json({
    success: true, 
    statusCode: 200,
    code: 'LOGOUT_SUCCESS',
    message: "Logged out successfully"
  });
}