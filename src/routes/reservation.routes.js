const express = require("express");
const router = express.Router();
const reservationController = require("../controllers/reservation.controller");
const { verifyToken, authorizeRoles } = require("../middlewares/auth.middleware");

/**
 * @swagger
 * tags:
 *   - name: Reservations
 *     description: Table reservation management
 */

/**
 * @swagger
 * /reservations:
 *   post:
 *     summary: Create reservation
 *     tags: [Reservations]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - tableId
 *               - reservationDate
 *               - startTime
 *               - numberOfGuests
 *             properties:
 *               tableId:
 *                 type: string
 *                 example: "60d21b4667d0d8992e610c85"
 *               reservationDate:
 *                 type: string
 *                 format: date
 *                 example: "2026-04-01"
 *               startTime:
 *                 type: string
 *                 example: "18:30"
 *               numberOfGuests:
 *                 type: number
 *                 example: 4
 *               note:
 *                 type: string
 *                 example: "Window seat please"
 *     responses:
 *       201:
 *         description: Reservation created successfully
 */
router.post("/", verifyToken, authorizeRoles("customer", "admin"), reservationController.createReservation);

/**
 * @swagger
 * /reservations/my:
 *   get:
 *     summary: Get my reservations
 *     tags: [Reservations]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of my reservations
 */
router.get("/my", verifyToken, authorizeRoles("customer", "admin"), reservationController.getMyReservations);

/**
 * @swagger
 * /reservations/{id}/cancel:
 *   put:
 *     summary: User requests to cancel reservation (Change status to cancel_request)
 *     tags: [Reservations]
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
 *         description: Cancellation request sent to admin
 */
router.put("/:id/cancel", verifyToken, authorizeRoles("customer", "admin"), reservationController.cancelReservation);

/**
 * @swagger
 * /reservations/{id}:
 *   delete:
 *     summary: Delete reservation history
 *     tags: [Reservations]
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
 *         description: Reservation deleted successfully
 */
router.delete("/:id", verifyToken, authorizeRoles("customer", "admin"), reservationController.deleteReservation);

/**
 * @swagger
 * /reservations/admin:
 *   get:
 *     summary: Admin get all reservations
 *     tags: [Reservations]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of all reservations
 */
router.get("/admin", verifyToken, authorizeRoles("admin"), reservationController.getAllReservations);

/**
 * @swagger
 * /reservations/admin/{id}/status:
 *   put:
 *     summary: Update reservation status & Process Auto-Refund (Admin)
 *     tags: [Reservations]
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
 *                   - pending_payment
 *                   - paid
 *                   - confirmed
 *                   - completed
 *                   - cancelled
 *                   - cancel_request
 *                 example: "confirmed"
 *     responses:
 *       200:
 *         description: Status updated (Refund processed if status is cancelled)
 *       400:
 *         description: Invalid status or not enough stock
 */
router.put("/admin/:id/status", verifyToken, authorizeRoles("admin"), reservationController.updateReservationStatus);

module.exports = router;