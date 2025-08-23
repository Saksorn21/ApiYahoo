const allowlist = process.env.BACKEND_LIST
  ? process.env.BACKEND_LIST.split(",")
  : [];

const isProd = process.env.NODE_ENV === "production";

// Optional: default dev origins
const devOrigins = [
  "http://localhost:3000",           // local dev
  "https://3403af8d-1ebd-4892-becc-e20b2c2041a9-00-fstkim4pgg77.riker.replit.dev" // Replit dev
];

export const corsOptionsDelegate = (req, callback) => {
  let corsOptions;
  const origin = req.header("Origin") || "";

  if (req.path.startsWith("/auth") || req.path.startsWith("/admin")) {
    // Auth/admin → ต้อง credential
    if (isProd) {
      corsOptions = {
        origin: process.env.FONTEND_MAIN,
        credentials: true,
      };
    } else {
      // dev → auto detect
      corsOptions = {
        origin: devOrigins.includes(origin) ? origin : false,
        credentials: true,
      };
    }
  } else if (req.path.startsWith("/api")) {
    // Public API → allowlist หรือ dev เปิดกว้าง
    if (!isProd || allowlist.includes(origin)) {
      corsOptions = { origin: origin || true, credentials: true };
    } else {
      corsOptions = { origin: false };
    }
  } else {
    corsOptions = { origin: false };
  }

  callback(null, corsOptions);
};