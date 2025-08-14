


  const allowlist = [process.env.FONTEND_LIST] || [""]; // เพิ่ม origin ได้
 export const corsOptionsDelegate = (req, callback) => {
    let corsOptions;

    if (req.path.startsWith("/auth") || req.path.startsWith("/admin")) {
      // Auth API → allow เฉพาะเว็บคุณ
      corsOptions = { origin: process.env.FONTEND_MAIN, credentials: true };
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