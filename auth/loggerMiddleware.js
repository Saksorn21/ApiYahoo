import logger from "../utils/logger.js"

import chalk from 'chalk';

export const logConsole = (req, res, next) => {
  const start = process.hrtime();

  res.on('finish', () => {
    try {
      const [sec, nano] = process.hrtime(start);
      const responseTime = (sec * 1e3 + nano / 1e6).toFixed(2);

      const logLevel = getLogLevel(res.statusCode);

      // เรียก debug แยกตอน dev mode เพื่อพิมพ์ body กับ query
      logger.debug('📝 Body:', req.body);
      logger.debug('🔍 Query:', req.query);

      // ส่ง log หลัก
      logger.log(
        req.method,
        logLevel,
        res.statusCode,
        req.originalUrl,
        parseFloat(responseTime),
        res.locals.errorMessage // ถ้ามี error message เก็บไว้
      );
    } catch (err) {
      console.error('Logger error:', err);
    }
  });

  next();
};

function getLogLevel(status) {
  if (status >= 500) return 'error';
  if (status >= 400) return 'error';
  if (status >= 300) return 'warn';
  return 'info';
}