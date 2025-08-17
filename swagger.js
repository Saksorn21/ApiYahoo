
import swaggerJSDoc from "swagger-jsdoc";
import rateLimit from "express-rate-limit";
import YAML from 'yamljs';
import swaggerUi from 'swagger-ui-express'
export const swaggerLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 นาที
  max: 20, // Swagger ไม่ควรโดน spam
  message: "Too many requests to Swagger, chill bro 🚫🔥",
});


const swaggerOptions = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "PortSnap API",
      description: "API documentation for PortSnap Yahoo Finance API",
      version: "1.0.0",
    },
    tags: [
      { name: "Admin", description: "Admin-only endpoints" },
      { name: "API", description: "Public API for clients" },
      { name: "Auth", description: "Authentication endpoints"}
    ],
    servers: [{ url: "https://44c550b7-54f4-4174-bd1d-c51ff1e4f8c8-00-1wilq50r88xfl.janeway.replit.dev",
              description: "Dev Server API"
              },{
      url: "https://api-portsanp.up.railway.app",
      description: "Server Railway API"
    }],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
      },
    },
  },
  },
  apis: ["./routers/*.js", "./auth/*.js", "./auth/admin/*.js"], // ตรงนี้ชี้ไฟล์ route ที่มีคอมเมนต์
};
export const swaggerDocument = YAML.load('./docs/openapi.yaml');
const adminPaths = YAML.load('./docs/paths/admin.yaml');
//const adminUsers = YAML.load('./docs/paths/users.yaml');
// ถ้าต้องการ path อื่นก็โหลดเหมือนกัน เช่น authPaths, productPaths

// Merge paths เข้ากับ swaggerDoc
  swaggerDocument.paths = {
  ...swaggerDocument.paths,
  ...adminPaths,
 // ...adminUsers
  // ...authPaths,
  // ...productPaths
}
export const swaggerSpec = swaggerJSDoc(swaggerOptions);

export const swaggerJson = (req, res) => {
    const allowedTags = ["API"];

    const filteredPaths = Object.keys(swaggerDocument.paths).reduce((acc, pathKey) => {
      const pathItem = swaggerDocument.paths[pathKey];
      const filteredMethods = {};

      for (const methodKey of Object.keys(pathItem)) {
        const method = pathItem[methodKey];
        if (method.tags && method.tags.some(tag => allowedTags.includes(tag))) {
          filteredMethods[methodKey] = method;
        }
      }

      if (Object.keys(filteredMethods).length > 0) {
        acc[pathKey] = filteredMethods;
      }

      return acc;
    }, {});

    const filteredSpec = {
      ...swaggerDocument,
      paths: filteredPaths,
      tags: swaggerDocument.tags?.filter(tag => allowedTags.includes(tag.name)),
    };

    res.json(filteredSpec);
  }