const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema(
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

    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },

    comment: {
      type: String,
      trim: true,
    },

    isHidden: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

// ❗ mỗi reservation chỉ được review 1 lần
reviewSchema.index({ reservationId: 1 }, { unique: true });

module.exports = mongoose.model("Review", reviewSchema);