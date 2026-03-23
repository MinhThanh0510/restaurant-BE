const express = require("express");
const router = express.Router();

const preorderController = require("../controllers/preorder.controller");
const { verifyToken, authorizeRoles } = require("../middlewares/auth.middleware");


// ================= CUSTOMER =================

// tạo preorder
router.post("/", verifyToken, preorderController.createPreorder);

// lấy preorder theo reservation
router.get("/reservation/:reservationId", verifyToken, preorderController.getPreorderByReservation);


// ================= ADMIN =================

// cập nhật trạng thái preorder
router.put(
  "/:id/status",
  verifyToken,
  authorizeRoles("admin"),
  preorderController.updatePreorderStatus
);

module.exports = router;