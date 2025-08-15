import express from "express";

import { authLogin } from "../auth/login.js";
import { authLogout } from "../auth/logout.js";
import { getApiToken } from "../auth/apiToken.js";
import { authRegister } from "../auth/register.js";
import { refreshToken } from "../auth/refresh.js";
import getMe from "../auth/me.js"
import {
  authFromCookie,
  checkLogin,
  preventAccessIfLoggedIn,
} from "../auth/middleware.js";
import { payment } from "../auth/payment.js";

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
 *               identifier:
 *                 type: string
 *                 description: "Username or email of the user"
 *                 example: "usertest"
 *               password:
 *                 type: string
 *                 description: User password
 *             required:
 *               - identifier
 *               - password
 *     responses:
 *       '200':
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 statusCode:
 *                   type: integer
 *                 code:
 *                   type: string
 *                 message:
 *                   type: string
 *       '400':
 *         description: Missing fields
 *       '401':
 *         description: Invalid credentials or password
 */
authRouter.post("/login", preventAccessIfLoggedIn, authLogin);
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

authRouter.post("/logout", authFromCookie, checkLogin, authLogout);
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
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: User created
 */
authRouter.post("/register", preventAccessIfLoggedIn, authRegister);
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
authRouter.get("/dashboard", authFromCookie, checkLogin, (req, res) => {
  res.json({ msg: `Hello ${req.user.username}` });
});
/**
 * @swagger
 * /auth/me:
 *   get:
 *     summary: Get user information
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: Get user information
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 statusCode:
 *                   type: integer
 *                 code:
 *                   type: string
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                     username:
 *                       type: string
 *                     email:
 *                       type: string
 *                     role:
 *                       type: string
 *                       enum: [user, admin]
 *                       default: user
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       500:
 *         description: Get user information
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 statusCode:
 *                   type: integer
 *                 code:
 *                   type: string
 *                 message:
 *                   type: string
 *                 data:
 *                   type: null
 */
authRouter.get("/me", authFromCookie, checkLogin, getMe)
/**
 * @swagger
 * /auth/apikey:
 *   post:
 *     summary: get api token
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               expiresIn:
 *                 type: string
 *                 enum: [1d, 7d, 30d, 1y]
 *                 default: 7d
 *                 description: Token expiration time
 *     responses:
 *       200:
 *         description: get API Token
 */
authRouter.post("/apikey", authFromCookie, checkLogin, getApiToken);
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
 *               apiToken:
 *                 type: string
 *     responses:
 *       200:
 *         description: Created a new access token
 */
authRouter.post("/refresh", authFromCookie, refreshToken);
/**
 * @swagger
 * /auth/payment:
 *   post:
 *     summary: Payment member
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               amount:
 *                 type: number
 *               token:
 *                 type: string
 *               orderId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Payment successful
 *         content:
 *           application/json:
 *             example:
 *               message: 'Payment successful'
 *               chargeId: 'chargeId'
 *               status: 'chargeSstatus'
 *       400:
 *         description: Payment failed
 *         content:
 *           application/json:
 *             example:
 *               error: 'Payment failed'
 *               message: 'chargeFailure_message'
 */
authRouter.post("/payment", authFromCookie, payment);

export default router;
