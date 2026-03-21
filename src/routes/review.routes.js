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
router.put("/hide/:id", verifyToken, authorizeRoles("admin"), controller.hideReview);

module.exports = router;