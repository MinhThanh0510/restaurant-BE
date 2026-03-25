const express = require("express");
const router = express.Router();
const controller = require("../controllers/dashboard.controller");
const { verifyToken, authorizeRoles } = require("../middlewares/auth.middleware");

// Chỉ Admin mới được xem Dashboard
router.get("/", verifyToken, authorizeRoles("admin"), controller.getDashboardStats);

module.exports = router;