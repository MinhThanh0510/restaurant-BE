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


// ================= ADMIN GET ALL RESERVATIONS =================
router.get(
  "/admin",
  verifyToken,
  authorizeRoles("admin"),
  reservationController.getAllReservations
);


module.exports = router;