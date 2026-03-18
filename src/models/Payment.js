const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema(
{
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },

  reservationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Reservation",
    required: true,
  },

  amount: {
    type: Number,
    required: true,
  },

  paymentType: {
    type: String,
    enum: ["deposit", "full"],
    required: true,
  },

  status: {
    type: String,
    enum: ["pending", "paid", "failed", "refunded"],
    default: "pending",
  },

  paymentMethod: {
    type: String,
    enum: ["paypal", "cash"],
    default: "paypal",
  },

  transactionId: {
    type: String, // PayPal capture ID
  },

},
{ timestamps: true }
);

module.exports = mongoose.model("Payment", paymentSchema);