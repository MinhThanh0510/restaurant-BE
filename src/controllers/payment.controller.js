const paypal = require('@paypal/checkout-server-sdk');
const { client } = require('../config/paypal');
const Reservation = require("../models/Reservation");
const Payment = require("../models/Payment"); // Bắt buộc phải có dòng này

exports.createOrder = async (req, res) => {
  try {
    const { totalAmount } = req.body;

    if (!totalAmount) {
      return res.status(400).json({ success: false, message: "totalAmount is required" });
    }

    const request = new paypal.orders.OrdersCreateRequest();
    request.prefer("return=representation");
    request.requestBody({
      intent: 'CAPTURE',
      purchase_units: [{
        amount: {
          currency_code: 'USD',
          value: totalAmount.toString()
        }
      }]
    });

    const response = await client.execute(request);

    res.status(200).json({
      success: true,
      orderID: response.result.id,
      message: "PayPal Order created successfully"
    });

  } catch (error) {
    console.error("PayPal Create Order Error:", error);
    res.status(500).json({ success: false, message: "Failed to create PayPal order" });
  }
};

exports.captureOrder = async (req, res) => {
  try {
    const { orderID, reservationId } = req.body;

    if (!orderID || !reservationId) {
      return res.status(400).json({ success: false, message: "orderID and reservationId are required" });
    }

    const request = new paypal.orders.OrdersCaptureRequest(orderID);
    request.requestBody({});
    const response = await client.execute(request);

    if (response.result.status === "COMPLETED") {
      const reservation = await Reservation.findById(reservationId);
      if (!reservation) {
        return res.status(404).json({ success: false, message: "Reservation not found" });
      }

      const capturedAmount = response.result.purchase_units[0].payments.captures[0].amount.value;

      const newPayment = await Payment.create({
        userId: reservation.userId,
        reservationId: reservation._id,
        amount: Number(capturedAmount),
        paymentType: "full",
        status: "paid",
        paymentMethod: "paypal",
        transactionId: response.result.id
      });

      reservation.status = "paid";
      await reservation.save();

      return res.status(200).json({
        success: true,
        message: "Payment captured successfully. Waiting for admin confirmation.",
        payment: newPayment,
        reservation
      });
    } else {
      return res.status(400).json({ success: false, message: "Payment not completed" });
    }
  } catch (error) {
    console.error("PayPal Capture Error:", error);
    res.status(500).json({ success: false, message: "Failed to capture payment" });
  }
};