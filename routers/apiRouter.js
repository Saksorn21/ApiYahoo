import express from "express";
import chart from "../api/chart.js"
import quote from "../api/quote.js"
import news from "../api/news.js"
const apiRouter = express.Router()
/**
 * @swagger
 * /api/chart:
 *   get:
 *     summary: Get stock chart data by symbol
 *     security:
 *       - bearerAuth: []
 *     tags: [API]
 *     parameters:
 *       - in: query
 *         name: symbol
 *         required: true
 *         schema:
 *           type: string
 *         description: Stock symbol (e.g. NVDA)
 *         example: NVDA
 *       - in: query
 *         name: range
 *         required: false
 *         schema:
 *           type: string
 *           default: 1y
 *         description: Range of data (e.g. 1d, 5d, 1mo, 1y)
 *       - in: query
 *         name: interval
 *         required: false
 *         schema:
 *           type: string
 *           default: 1d
 *         description: Interval between data points (e.g. 1m, 5m, 1d)
 *       - in: query
 *         name: events
 *         required: false
 *         schema:
 *           type: string
 *           default: div, splits, capitalGains
 *         description: Event types to include (comma separated)
 *     responses:
 *       200:
 *         description: Stock chart data successfully retrieved
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               example:
 *                 chart:
 *                   result: [...]
 *                   error: null
 *       400:
 *         description: Missing required symbol parameter
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: No symbol
 *       500:
 *         description: Server error when fetching data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Server Data Error
 */
apiRouter.get('/chart',chart)
/**
 * @swagger
 * /api/quote/{symbol}:
 *   get:
 *     summary: Get quote for stock symbol
 *     security:
 *       - bearerAuth: []
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
apiRouter.get("/quote/:symbol", quote);
/**
 * @swagger
 * /api/news:
 *   get:
 *     summary: Get news for stock symbol
 *     security:
 *       - bearerAuth: []
 *     tags: [API]
 *     parameters:
 *       - in: query
 *         name: symbol
 *         required: true
 *         schema:
 *           type: string
 *         description: Stock symbol (e.g. NVDA)
 *         example: NVDA
 *       - in: query
 *         name: limit
 *         required: false
 *         schema:
 *           type: string
 *           default: 10
 *         description: News count limit
 *     responses:
 *       200:
 *         description: Stock news data successfully retrieved
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               example:
 *                 news:
 *                   explains: []
 *                   count: number
 *                   quotes: [...]
 *                   error: null
 *       400:
 *         description: Missing required symbol parameter
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: No symbol
 *       500:
 *         description: Server error when fetching data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Server Data Error
 */
apiRouter.get("/news", news)
export default apiRouter