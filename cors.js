


const allowlist = process.env.BACKEND_LIST
? process.env.BACKEND_LIST.split(",") 
  : []
const isProd = process.env.NODE_ENV === "production";
 export const corsOptionsDelegate = (req, callback) => {
    let corsOptions;

    if (req.path.startsWith("/auth") || req.path.startsWith("/admin")) {
      // Auth API → allow เฉพาะเว็บคุณ
      corsOptions = { origin: isProd ?  process.env.FONTEND_MAIN : true,  credentials: true };
    } else if (req.path.startsWith("/api")) {
      // Public API → อนุญาตตาม allowlist หรือเปิดกว้าง (แต่มี JWT)
      if (allowlist.indexOf(req.header("Origin")) !== -1) {
        corsOptions = { origin: true };
      } else {
        corsOptions = { origin: false }; // ไม่อนุญาต origin แปลก
      }
    } else {
      corsOptions = { origin: false };
    }

    callback(null, corsOptions);
  };