const Review = require("../models/Review");
const Reservation = require("../models/Reservation");

// ================= CREATE REVIEW =================
exports.createReview = async (req, res) => {
  try {
    const { reservationId, rating, comment } = req.body;
    const userId = req.user.id;

    if (!reservationId || !rating) {
      return res.status(400).json({
        message: "reservationId and rating are required",
      });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({
        message: "Rating must be 1-5",
      });
    }

    const reservation = await Reservation.findById(reservationId);

    if (!reservation) {
      return res.status(404).json({
        message: "Reservation not found",
      });
    }

    // ❗ chỉ được review chính booking của mình
    if (!reservation.userId.equals(userId)) {
        return res.status(403).json({
            message: "Not your reservation",
    });
    }

    // ❗ chỉ review khi đã hoàn thành
    if (reservation.status !== "completed") {
      return res.status(400).json({
        message: "You can only review after completion",
      });
    }

    const review = await Review.create({
      userId,
      reservationId,
      rating,
      comment,
    });

    res.status(201).json({
      message: "Review created",
      review,
    });

  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({
        message: "You already reviewed this reservation",
      });
    }

    res.status(500).json({ message: err.message });
  }
};

// ================= GET ALL REVIEWS =================
exports.getAllReviews = async (req, res) => {
  try {
    const reviews = await Review.find({ isHidden: false })
      .populate("userId", "fullName")
      .populate("reservationId", "bookingCode")
      .sort({ createdAt: -1 });

    const total = reviews.length;

    const avgRating =
      total === 0
        ? 0
        : reviews.reduce((sum, r) => sum + r.rating, 0) / total;

    res.json({
      total,
      avgRating: avgRating.toFixed(1),
      reviews,
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ================= GET MY REVIEWS =================
exports.getMyReviews = async (req, res) => {
  try {
    const userId = req.user.id;

    const reviews = await Review.find({ userId })
      .populate("reservationId", "bookingCode")
      .sort({ createdAt: -1 });

    res.json({
      total: reviews.length,
      reviews,
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ================= DELETE REVIEW =================
exports.deleteReview = async (req, res) => {
  try {
    const { id } = req.params;

    const review = await Review.findById(id);

    if (!review) {
      return res.status(404).json({
        message: "Review not found",
      });
    }

    if (
      review.userId.toString() !== req.user.id &&
      req.user.role !== "admin"
    ) {
      return res.status(403).json({
        message: "Not allowed",
      });
    }

    await review.deleteOne();

    res.json({
      message: "Review deleted",
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ================= ADMIN HIDE REVIEW =================
exports.hideReview = async (req, res) => {
  try {
    const { id } = req.params;

    const review = await Review.findByIdAndUpdate(
      id,
      { isHidden: true },
      { new: true }
    );

    if (!review) {
      return res.status(404).json({
        message: "Review not found",
      });
    }

    res.json({
      message: "Review hidden",
      review,
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};