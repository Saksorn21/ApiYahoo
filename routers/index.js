import express from "express"
import quote from "./quote.js"
import { authLogin } from "../auth/login.js"
import { getApiToken  } from "../auth/apiToken.js"
import { authRegister  } from "../auth/register.js"
import { refreshToken } from "../auth/refresh.js"
import { authFromCookie, authFromBearer, authenticateToken} from "../auth/middleware.js"
const router = express.Router();

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
router.post("/login", authLogin)
/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Register username and password
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
router.post("/register", authRegister)
router.get("/dashboard", authFromCookie, (req, res) =>{
  res.json({ msg: `Hello ${req.user.user}` })
})
router.post("/api-token", authenticateToken, getApiToken)
router.post("/refresh", refreshToken)
router.get("/quote/:symbol",quote)
export default router