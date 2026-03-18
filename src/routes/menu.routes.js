const express = require("express");
const router = express.Router();

const menuController = require("../controllers/menu.controller");
const { verifyToken, authorizeRoles } = require("../middlewares/auth.middleware");


// ================= CUSTOMER =================

// Lấy tất cả menu (group theo category)
router.get("/", menuController.getAllMenus);

// Lấy menu theo danh mục
router.get("/category/:categoryId", menuController.getMenuByCategory);

// 🔥 LẤY CHI TIẾT MÓN (QUAN TRỌNG)
router.get("/:id", menuController.getMenuDetail);


// ================= ADMIN =================

// Thêm món
router.post("/", verifyToken, authorizeRoles("admin"), menuController.createMenu);

// Sửa món
router.put("/:id", verifyToken, authorizeRoles("admin"), menuController.updateMenu);

// Xóa món
router.delete("/:id", verifyToken, authorizeRoles("admin"), menuController.deleteMenu);

module.exports = router;