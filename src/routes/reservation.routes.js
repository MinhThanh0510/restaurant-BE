const express = require("express");
const router = express.Router();

const reservationController = require("../controllers/reservation.controller");
const {
  verifyToken,
  authorizeRoles,
} = require("../middlewares/auth.middleware");


// ================= CREATE RESERVATION =================
router.post(
  "/",
  verifyToken,
  authorizeRoles("customer", "admin"),
  reservationController.createReservation
);


// ================= GET MY RESERVATIONS =================
router.get(
  "/my",
  verifyToken,
  authorizeRoles("customer", "admin"),
  reservationController.getMyReservations
);


// ================= CANCEL RESERVATION =================
router.put(
  "/:id/cancel",
  verifyToken,
  authorizeRoles("customer", "admin"),
  reservationController.cancelReservation
);

// ================= DELETE RESERVATION =================
router.delete(
  "/:id",
  verifyToken,
  authorizeRoles("customer", "admin"), // Cho phép cả Customer và Admin
  reservationController.deleteReservation
);


// ================= ADMIN GET ALL RESERVATIONS =================
router.get(
  "/admin",
  verifyToken,
  authorizeRoles("admin"),
  reservationController.getAllReservations
);

router.put("/admin/:id/status", verifyToken, authorizeRoles("admin"), reservationController.updateReservationStatus);


module.exports = router;