const express = require("express");
const router = express.Router();
const inventoryController = require("../controllers/inventory.controller");

// 🔥 Import middleware bảo mật
const { verifyToken, authorizeRoles } = require("../middlewares/auth.middleware");

// ===============================================
// 1. CÁC ROUTE CÔNG KHAI HOẶC CHUNG
// ===============================================
// Lấy danh sách kho (Admin dùng để xem, Menu dùng để map nguyên liệu)
router.get("/", inventoryController.getAllInventory);

// ===============================================
// 2. CÁC ROUTE DÀNH RIÊNG CHO ADMIN
// ===============================================
// Thêm nguyên liệu
router.post("/", verifyToken, authorizeRoles("admin"), inventoryController.createInventoryItem);

// Cập nhật nguyên liệu (Sửa tên, số lượng, đơn vị)
router.put("/:id", verifyToken, authorizeRoles("admin"), inventoryController.updateInventoryItem);

// Xóa nguyên liệu
router.delete("/:id", verifyToken, authorizeRoles("admin"), inventoryController.deleteInventoryItem);

module.exports = router;