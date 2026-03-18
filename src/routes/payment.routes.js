const express = require("express");
const router = express.Router();

const paymentController = require("../controllers/payment.controller");
const { verifyToken } = require("../middlewares/auth.middleware");

// 👉 PayPal flow
router.post("/paypal/create-order", verifyToken, paymentController.createPaypalOrder);
router.post("/paypal/capture-order", verifyToken, paymentController.capturePaypalOrder);

module.exports = router;