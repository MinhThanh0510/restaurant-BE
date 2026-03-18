const mongoose = require("mongoose");
const { paypal, client } = require("../config/paypal");

const Payment = require("../models/Payment");
const Reservation = require("../models/Reservation");
const Menu = require("../models/Menu");
const Inventory = require("../models/Inventory");


// ================= CREATE PAYPAL ORDER =================
exports.createPaypalOrder = async (req, res) => {
  try {
    const { reservationId, type } = req.body;

    if (!["deposit", "full"].includes(type)) {
      return res.status(400).json({ message: "Invalid payment type" });
    }

    const reservation = await Reservation.findById(reservationId);

    if (!reservation) {
      return res.status(404).json({ message: "Reservation not found" });
    }

    if (reservation.userId.toString() !== req.user.id) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    // ❗ tránh thanh toán lại full
    if (reservation.status === "confirmed") {
      return res.status(400).json({
        message: "Reservation already fully paid",
      });
    }

    let amount = 0;

    if (type === "deposit") {
      amount = reservation.preorderTotal > 0
        ? reservation.preorderTotal * 0.5
        : 10;
    } else {
      amount = reservation.preorderTotal;
    }

    const request = new paypal.orders.OrdersCreateRequest();

    request.requestBody({
      intent: "CAPTURE",
      purchase_units: [
        {
          amount: {
            currency_code: "USD",
            value: amount.toFixed(2),
          },
        },
      ],
    });

    const order = await client.execute(request);

    res.json({
      orderId: order.result.id,
    });

  } catch (error) {
    res.status(500).json({
      message: "Create PayPal order failed",
      error: error.message,
    });
  }
};


// ================= CAPTURE PAYMENT =================
exports.capturePaypalOrder = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { orderId, reservationId, type } = req.body;

    const reservation = await Reservation.findById(reservationId).session(session);

    if (!reservation) {
      throw new Error("Reservation not found");
    }

    // 👉 capture PayPal
    const request = new paypal.orders.OrdersCaptureRequest(orderId);
    request.requestBody({});

    const capture = await client.execute(request);
    const data = capture.result;

    if (data.status !== "COMPLETED") {
      throw new Error("Payment not completed");
    }

    const captureInfo = data.purchase_units[0].payments.captures[0];

    // ❗ chống thanh toán trùng
    const existing = await Payment.findOne({
      reservationId,
      paymentType: type,
      status: "paid",
    }).session(session);

    if (existing) {
      throw new Error("Already paid");
    }

    // 👉 SAVE PAYMENT
    const payment = await Payment.create([{
      userId: req.user.id,
      reservationId,
      amount: captureInfo.amount.value,
      paymentType: type,
      status: "paid",
      transactionId: captureInfo.id,
    }], { session });

    // ================= 🔥 TRỪ INVENTORY =================
    for (const item of reservation.preorder) {

      const menu = await Menu.findById(item.menuId)
        .populate("ingredients.ingredientId")
        .session(session);

      if (!menu) {
        throw new Error("Menu not found");
      }

      for (const ing of menu.ingredients) {

        if (!ing.ingredientId) {
          throw new Error("IngredientId is NULL");
        }

        const required = ing.quantity * item.quantity;

        const updated = await Inventory.findOneAndUpdate(
          {
            _id: ing.ingredientId._id,
            quantity: { $gte: required },
          },
          {
            $inc: { quantity: -required },
          },
          { session }
        );

        if (!updated) {
          throw new Error(`Not enough ${ing.ingredientId.name}`);
        }
      }
    }

    // ================= UPDATE RESERVATION =================
    if (type === "deposit") {
      reservation.status = "deposit_paid";
    } else if (type === "full") {
      reservation.status = "confirmed";
    }

    await reservation.save({ session });

    await session.commitTransaction();
    session.endSession();

    res.json({
      message: "Payment successful",
      payment,
    });

  } catch (error) {
    await session.abortTransaction();
    session.endSession();

    res.status(500).json({
      message: error.message,
    });
  }
};


// ================= REFUND =================
exports.refundPayment = async (req, res) => {
  try {
    const { paymentId } = req.body;

    const payment = await Payment.findById(paymentId);

    if (!payment) {
      return res.status(404).json({ message: "Payment not found" });
    }

    const request = new paypal.payments.CapturesRefundRequest(
      payment.transactionId
    );

    request.requestBody({
      amount: {
        value: payment.amount.toString(),
        currency_code: "USD",
      },
    });

    const refund = await client.execute(request);

    payment.status = "refunded";
    await payment.save();

    res.json({
      message: "Refund successful",
      refund: refund.result,
    });

  } catch (error) {
    res.status(500).json({
      message: "Refund failed",
      error: error.message,
    });
  }
};