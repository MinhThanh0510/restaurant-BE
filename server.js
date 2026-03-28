require("dotenv").config();
// 🔥 THAY ĐỔI DÒNG NÀY: Lấy đúng 'app' và 'server' từ Object export
const { app, server } = require("./src/app");
const connectDB = require("./src/config/db");

const swaggerUi = require("swagger-ui-express");
const swaggerJsdoc = require("swagger-jsdoc");

const swaggerOptions = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Restaurant System API",
      version: "1.0.0",
      description: "API Documentation for the Restaurant Management System",
    },
    servers: [
      {
        url: "http://localhost:5000/api",
        description: "Local Development Server",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
    },
    security: [{ bearerAuth: [] }],
  },
  apis: ["./src/routes/*.js"],
};

const swaggerDocs = swaggerJsdoc(swaggerOptions);

// Swagger vẫn dùng 'app' để định nghĩa route
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocs));

const PORT = process.env.PORT || 5000;
connectDB();

// 🔥 THAY ĐỔI DÒNG NÀY: Dùng 'server.listen' thay vì 'app.listen'
// Socket.io cần chạy trên 'server' (http) thì mới nhận được kết nối real-time
server.listen(PORT, () => {
  console.log(`🚀 Server (with Socket.io) running on port ${PORT}`);
  console.log(`📖 Swagger docs available at http://localhost:${PORT}/api-docs`);
});