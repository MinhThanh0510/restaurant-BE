const express = require("express");
const router = express.Router();

const controller = require("../controllers/review.controller");
const { verifyToken, authorizeRoles } = require("../middlewares/auth.middleware");

// USER
router.post("/", verifyToken, controller.createReview);
router.get("/", controller.getAllReviews);
router.get("/my", verifyToken, controller.getMyReviews);
router.delete("/:id", verifyToken, controller.deleteReview);

// ADMIN
router.get("/admin", verifyToken, authorizeRoles("admin"), controller.getAdminReviews);
router.put("/:id/toggle-hide", verifyToken, authorizeRoles("admin"), controller.toggleHideReview);

module.exports = router;