const express = require("express");
const router = express.Router();
const controller = require("../controllers/review.controller");
const { verifyToken, authorizeRoles } = require("../middlewares/auth.middleware");

/**
 * @swagger
 * tags:
 *   - name: Reviews
 *     description: Customer reviews and ratings
 */

/**
 * @swagger
 * /reviews:
 *   post:
 *     summary: Create review
 *     tags: [Reviews]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - reservationId
 *               - rating
 *               - comment
 *             properties:
 *               reservationId:
 *                 type: string
 *                 example: "60d21b4667d0d8992e610c85"
 *               rating:
 *                 type: number
 *                 minimum: 1
 *                 maximum: 5
 *                 example: 5
 *               comment:
 *                 type: string
 *                 example: "Great food and service!"
 *     responses:
 *       201:
 *         description: Review created successfully
 *       400:
 *         description: Invalid input data
 */
router.post("/", verifyToken, controller.createReview);

/**
 * @swagger
 * /reviews:
 *   get:
 *     summary: Get all reviews
 *     tags: [Reviews]
 *     responses:
 *       200:
 *         description: List of all reviews
 */
router.get("/", controller.getAllReviews);

/**
 * @swagger
 * /reviews/my:
 *   get:
 *     summary: Get my reviews
 *     tags: [Reviews]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of my reviews
 */
router.get("/my", verifyToken, controller.getMyReviews);

/**
 * @swagger
 * /reviews/{id}:
 *   delete:
 *     summary: Delete review
 *     tags: [Reviews]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Review deleted successfully
 *       404:
 *         description: Review not found
 */
router.delete("/:id", verifyToken, controller.deleteReview);

/**
 * @swagger
 * /reviews/admin:
 *   get:
 *     summary: Admin get reviews
 *     tags: [Reviews]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of admin reviews
 */
router.get("/admin", verifyToken, authorizeRoles("admin"), controller.getAdminReviews);

/**
 * @swagger
 * /reviews/{id}/toggle-hide:
 *   put:
 *     summary: Toggle hide review (Admin)
 *     tags: [Reviews]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Review status updated successfully
 *       404:
 *         description: Review not found
 */
router.put("/:id/toggle-hide", verifyToken, authorizeRoles("admin"), controller.toggleHideReview);

module.exports = router;