const mongoose = require("mongoose");

const reservationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    // ===== CUSTOMER INFO =====
    customerInfo: {
      fullName: {
        type: String,
        required: true,
        trim: true,
      },
      phone: {
        type: String,
        required: true,
      },
      email: {
        type: String,
        trim: true,
        lowercase: true,
      },
    },

    // ===== TABLE =====
    tableId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Table",
      required: true,
    },

    bookingCode: {
      type: String,
      unique: true,
      required: true,
    },

    // ===== TIME =====
    reservationDate: {
      type: Date,
      required: true,
    },

    startTime: {
      type: Date,
      required: true,
    },

    endTime: {
      type: Date,
      required: true,
    },

    numberOfGuests: {
      type: Number,
      required: true,
      min: 1,
    },

    note: {
      type: String,
      default: "",
    },

    // ===== 🔥 PREORDER GỘP =====
    // preorder: [
    //   {
    //     menuId: {
    //       type: mongoose.Schema.Types.ObjectId,
    //       ref: "Menu",
    //       required: true,
    //     },
    //     quantity: {
    //       type: Number,
    //       required: true,
    //       min: 1,
    //     },
    //     price: {
    //       type: Number,
    //       required: true,
    //       min: 0,
    //     },
    //   },
    // ],

    // preorderTotal: {
    //   type: Number,
    //   default: 0,
    //   min: 0,
    // },

    // ===== STATUS =====
    status: {
      type: String,
      enum: ["pending", "confirmed", "cancelled", "completed"],
      default: "pending",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Reservation", reservationSchema);