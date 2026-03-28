const mongoose = require("mongoose");

const preorderSchema = new mongoose.Schema(
  {
    reservationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Reservation",
      required: true,
    },

    items: [
      {
        menuId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Menu",
          required: true,
        },
        quantity: {
          type: Number,
          required: true,
          min: 1,
        },
        price: {
          type: Number,
          required: true,
        },
      },
    ],

    totalAmount: {
      type: Number,
      required: true,
    },

    status: {
      type: String,
      enum: ["received", "preparing", "ready", "cancelled"],
      default: "received",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Preorder", preorderSchema);