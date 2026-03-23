const express = require("express");
const router = express.Router();
const menuController = require("../controllers/menu.controller");
const { verifyToken, authorizeRoles } = require("../middlewares/auth.middleware");

// ===============================================
// 1. CÁC ROUTE CỦA ADMIN (PHẢI ĐẶT LÊN TRÊN CÙNG)
// ===============================================

// Lấy toàn bộ Menu dạng phẳng cho Admin
router.get("/admin", verifyToken, authorizeRoles("admin"), menuController.getAllAdminMenus);

// Thêm món
router.post("/", verifyToken, authorizeRoles("admin"), menuController.createMenu);

// Sửa món
router.put("/:id", verifyToken, authorizeRoles("admin"), menuController.updateMenu);

// Xóa món
router.delete("/:id", verifyToken, authorizeRoles("admin"), menuController.deleteMenu);


// ===============================================
// 2. CÁC ROUTE CỦA CUSTOMER (ĐẶT BÊN DƯỚI)
// ===============================================

// Lấy tất cả menu (group theo category)
router.get("/", menuController.getAllMenus);

// Lấy menu theo danh mục
router.get("/category/:categoryId", menuController.getMenuByCategory);

// 🔥 LẤY CHI TIẾT MÓN (Route có :id BẮT BUỘC phải nằm dưới cùng)
router.get("/:id", menuController.getMenuDetail);

module.exports = router;