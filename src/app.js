const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const cookieParser = require("cookie-parser");
const http = require("http");
const { Server } = require("socket.io");

// 🔥 IMPORT MODEL VÀ ROUTE CHO MESSAGE
const Message = require("./models/Message"); // Đảm bảo đúng đường dẫn đến file model
const messageRoutes = require("./routes/message.routes");

// ================= IMPORT ROUTES KHÁC =================
const testRoutes = require("./routes/test.routes");
const authRoutes = require("./routes/auth.routes");
const tableRoutes = require("./routes/table.routes");
const reservationRoutes = require("./routes/reservation.routes");
const menuRoutes = require("./routes/menu.routes");
const preorderRoutes = require("./routes/preorder.routes");
const reviewRoutes = require("./routes/review.routes");
const categoryRoutes = require("./routes/category.routes");
const inventoryRoutes = require("./routes/inventory.routes");
const dashboardRoutes = require("./routes/dashboard.routes");
const paymentRoutes = require("./routes/payment.routes");

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
  },
});

// ================= LOGIC SOCKET.IO (ĐÃ NÂNG CẤP LƯU DB) =================
io.on("connection", (socket) => {
  console.log(`User connected: ${socket.id} 💬`);

  socket.on("join_room", (userId) => {
    socket.join(userId);
    console.log(`User with ID: ${userId} joined room`);
  });

  // 🔥 LẮNG NGHE VÀ LƯU TIN NHẮN VÀO DATABASE
  socket.on("send_message", async (data) => {
    try {
      const { senderId, receiverId, message } = data;

      // 1. Lưu vào MongoDB để giữ lịch sử chat
      const savedMsg = await Message.create({
        senderId,
        receiverId,
        message
      });

      // 2. Gửi cho người nhận (theo roomId là receiverId)
      io.to(receiverId).emit("receive_message", savedMsg);

      // 3. Gửi lại cho chính người gửi để cập nhật UI
      io.to(senderId).emit("receive_message", savedMsg);


    } catch (error) {
      console.error("Socket Send Message Error:", error);
    }
  });

  socket.on("disconnect", () => {
    console.log("User Disconnected", socket.id);
  });
});

// ================= GLOBAL MIDDLEWARES =================
app.use(cors());
app.use(express.json());
app.use(cookieParser());
app.use(morgan("dev"));

// ================= API ROUTES =================
app.use("/api/auth", authRoutes);
app.use("/api/test", testRoutes);
app.use("/api/tables", tableRoutes);
app.use("/api/reservations", reservationRoutes);
app.use("/api/menus", menuRoutes);
app.use("/api/preorders", preorderRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/inventory", inventoryRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/payment", paymentRoutes);

app.get("/", (req, res) => {
  res.json({
    message: "Restaurant API Running with Socket.io & Chat History 🚀",
  });
});

app.use((err, req, res, next) => {
  res.status(500).json({
    message: "Internal Server Error",
    error: err.message,
  });
});

module.exports = { app, server };