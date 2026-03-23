const express = require("express");
const router = express.Router();
const categoryController = require("../controllers/category.controller");
const { verifyToken, authorizeRoles } = require("../middlewares/auth.middleware");

// Khách hàng & Admin đều xem được
router.get("/", categoryController.getAllCategories);

// Chỉ Admin mới được Thêm, Sửa, Xóa
router.post("/", verifyToken, authorizeRoles("admin"), categoryController.createCategory);
router.put("/:id", verifyToken, authorizeRoles("admin"), categoryController.updateCategory);
router.delete("/:id", verifyToken, authorizeRoles("admin"), categoryController.deleteCategory);

module.exports = router;