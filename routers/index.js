import express from "express"
import quote from "./quote.js"
import { login } from "../auth/login.js"
import { refreshToken } from "../auth/refresh.js"
const router = express.Router();
router.post("/login", login)
router.post("/refresh", refreshToken)
router.get("/quote/:symbol",quote)
export default router