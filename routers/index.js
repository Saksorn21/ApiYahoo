import express from "express"
import quote from "./quote.js"
const router = express.Router();

router.get("/quote/:symbol",quote)
export default router