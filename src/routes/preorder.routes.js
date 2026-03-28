const express = require("express");
const router = express.Router();
const preorderController = require("../controllers/preorder.controller");
const { verifyToken, authorizeRoles } = require("../middlewares/auth.middleware");

/**
 * @swagger
 * tags:
 *   - name: Preorders
 *     description: Pre-order food before arrival
 */

/**
 * @swagger
 * /preorders:
 *   post:
 *     summary: Create a preorder
 *     tags: [Preorders]
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
 *               - items
 *             properties:
 *               reservationId:
 *                 type: string
 *                 example: "60d21b4667d0d8992e610c85"
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required:
 *                     - menuId
 *                     - quantity
 *                   properties:
 *                     menuId:
 *                       type: string
 *                       example: "60d21b4667d0d8992e610c85"
 *                     quantity:
 *                       type: number
 *                       example: 2
 *     responses:
 *       201:
 *         description: Preorder created successfully
 *       400:
 *         description: Invalid input data
 */
router.post("/", verifyToken, preorderController.createPreorder);

/**
 * @swagger
 * /preorders/reservation/{reservationId}:
 *   get:
 *     summary: Get preorder by reservation
 *     tags: [Preorders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: reservationId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Preorder found
 *       404:
 *         description: Preorder not found
 */
router.get("/reservation/:reservationId", verifyToken, preorderController.getPreorderByReservation);

/**
 * @swagger
 * /preorders/{id}/status:
 *   put:
 *     summary: Update preorder status (Admin)
 *     tags: [Preorders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum:
 *                   - received
 *                   - preparing
 *                   - ready
 *                   - cancelled
 *                 example: "preparing"
 *     responses:
 *       200:
 *         description: Preorder status updated successfully
 *       400:
 *         description: Invalid status
 */
router.put("/:id/status", verifyToken, authorizeRoles("admin"), preorderController.updatePreorderStatus);

module.exports = router;