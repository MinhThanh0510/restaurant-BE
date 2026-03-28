const express = require("express");
const router = express.Router();
const paymentController = require("../controllers/payment.controller");
const { verifyToken } = require("../middlewares/auth.middleware");

/**
 * @swagger
 * tags:
 *   - name: Payment
 *     description: PayPal payment integration
 */

/**
 * @swagger
 * /payment/create-order:
 *   post:
 *     summary: Create a PayPal order to get orderID
 *     tags: [Payment]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - totalAmount
 *             properties:
 *               totalAmount:
 *                 type: number
 *                 example: 55.5
 *     responses:
 *       200:
 *         description: Successfully created PayPal order
 *       400:
 *         description: Missing totalAmount
 *       500:
 *         description: Internal server error
 */
router.post("/create-order", verifyToken, paymentController.createOrder);

/**
 * @swagger
 * /payment/capture-order:
 *   post:
 *     summary: Capture a PayPal payment and update reservation status to Paid
 *     tags: [Payment]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - orderID
 *               - reservationId
 *             properties:
 *               orderID:
 *                 type: string
 *                 example: "5O190127TN364715T"
 *                 description: The PayPal order ID obtained from create-order API
 *               reservationId:
 *                 type: string
 *                 example: "60d21b4667d0d8992e610c85"
 *                 description: The ID of the reservation being paid for
 *     responses:
 *       200:
 *         description: Payment captured successfully and reservation status updated
 *       400:
 *         description: Missing required fields or payment not completed
 *       404:
 *         description: Reservation not found
 *       500:
 *         description: Internal server error
 */
router.post("/capture-order", verifyToken, paymentController.captureOrder);

module.exports = router;