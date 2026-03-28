const express = require("express");
const router = express.Router();
const controller = require("../controllers/dashboard.controller");
const { verifyToken, authorizeRoles } = require("../middlewares/auth.middleware");

/**
 * @swagger
 * tags:
 *   - name: Dashboard
 *     description: Admin dashboard statistics and analytics
 */

/**
 * @swagger
 * /dashboard:
 *   get:
 *     summary: Retrieve dashboard statistics
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Successfully retrieved dashboard stats
 */
router.get("/", verifyToken, authorizeRoles("admin"), controller.getDashboardStats);

module.exports = router;