const mongoose = require("mongoose");

const tableSchema = new mongoose.Schema(
  {
    tableNumber: {
      type: Number,
      required: true,
      unique: true,
    },
    capacity: {
      type: Number,
      required: true,
    },
    // 🔥 THÊM 2 TRƯỜNG NÀY VÀO
    location: {
      type: String,
      enum: ["indoor", "window", "outdoor"],
      default: "indoor",
    },
    price: {
      type: Number,
      default: 0, // Giá phụ thu cho bàn (VD: Bàn window thêm 5$)
    },
    status: {
      type: String,
      enum: ["available", "reserved", "maintenance"],
      default: "available",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Table", tableSchema);