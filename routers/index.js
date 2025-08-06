import express from "express"
import quote from "./quote.js"
import { authLogin } from "../auth/login.js"
import { authLogout } from "../auth/logout.js"
import { getApiToken  } from "../auth/apiToken.js"
import { authRegister  } from "../auth/register.js"
import { refreshToken } from "../auth/refresh.js"
import { authFromCookie, authFromBearer, authenticateToken} from "../auth/middleware.js"
const router = express.Router();
export const authRouter = express.Router();
/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Login user and get token
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Token returned
 */

/**
 * @swagger
 * /auth/logout:
 *   post:
 *     summary: Logout user
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: Logout user
 */
  authRouter.post("/login", authLogin)
 authRouter.post("/logout", authFromCookie, authLogout)
/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Register username and password
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: User created
 */
  authRouter.post("/register", authRegister)
/**
 * @swagger
 * /auth/dashboard:
 *   get:
 *     summary: Get user dashboard
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: desplay user dashboard
 */
  authRouter.get("/dashboard", authFromCookie, (req, res) =>{
  res.json({ msg: `Hello ${req.user.username}` })
})
/**
 * @swagger
 * /auth/api-token:
 *   poat:
 *     summary: get api token
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: created api token
 */
  authRouter.post("/api-token", authenticateToken, getApiToken)
/**
 * @swagger
 * /auth/refresh:
 *   post:
 *     summary: Refresh Token
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               refreshToken:
 *                 type: string
 *     responses:
 *       200:
 *         description: Created a new access token
 */
  authRouter.post("/refresh", refreshToken)
/**
 * @swagger
 * /api/quote/{symbol}:
 *   get:
 *     summary: Get quote for stock symbol
 *     tags: [API]
 *     parameters:
 *       - name: symbol
 *         in: path
 *         required: true
 *         description: Stock symbol (e.g., AAPL, TSLA)
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Stock quote data
 *         content:
 *           application/json:
 *             example:
 *               symbol: AAPL
 *               price: 173.72
 *               change: -2.10
 *               changePercent: -1.19%
 */
router.get("/quote/:symbol",quote)
export default router