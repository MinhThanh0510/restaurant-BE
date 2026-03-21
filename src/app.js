const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const cookieParser = require("cookie-parser");

// ================= IMPORT ROUTES =================
const testRoutes = require("./routes/test.routes");
const authRoutes = require("./routes/auth.routes");
const tableRoutes = require("./routes/table.routes");
const reservationRoutes = require("./routes/reservation.routes");
const menuRoutes = require("./routes/menu.routes");
const preorderRoutes = require("./routes/preorder.routes");
const paymentRoutes = require("./routes/payment.routes");
const reviewRoutes = require("./routes/review.routes");

const app = express();

// ================= GLOBAL MIDDLEWARES =================
app.use(cors());
app.use(express.json());
app.use(cookieParser());
app.use(morgan("dev"));

// ================= API ROUTES =================

// Auth APIs
app.use("/api/auth", authRoutes);

// Test API
app.use("/api/test", testRoutes);

// Restaurant APIs
app.use("/api/tables", tableRoutes);          // quản lý bàn
app.use("/api/reservations", reservationRoutes); // đặt bàn
app.use("/api/menus", menuRoutes);            // menu
app.use("/api/preorders", preorderRoutes);    // đặt món trước
app.use("/api/payments", paymentRoutes);
app.use("/api/reviews", reviewRoutes);


// ================= ROOT ROUTE =================
app.get("/", (req, res) => {
  res.json({
    message: "Restaurant API Running 🚀",
  });
});
//===
app.use((err, req, res, next) => {
  res.status(500).json({
    message: "Internal Server Error",
    error: err.message,
  });
});

// ================= EXPORT APP =================
module.exports = app;