const Reservation = require("../models/Reservation");
const Table = require("../models/Table");
const Inventory = require("../models/Inventory");
const Preorder = require("../models/Preorder");
const paypal = require('@paypal/checkout-server-sdk');
const { client } = require('../config/paypal');
const Payment = require("../models/Payment");

exports.createReservation = async (req, res) => {
  try {
    const { tableId, reservationDate, startTime, numberOfGuests, note, fullName, phone, email } = req.body;
    const userId = req.user?.id;

    if (!tableId || !reservationDate || !startTime || !numberOfGuests) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const table = await Table.findById(tableId);
    if (!table) return res.status(404).json({ message: "Table not found" });

    const guests = Number(numberOfGuests);
    if (guests <= 0 || guests > table.capacity) {
      return res.status(400).json({ message: `Guests must be between 1 and ${table.capacity}` });
    }

    const start = new Date(`${reservationDate}T${startTime}:00`);
    const durationHours = guests > 6 ? 3.5 : 2.5;
    const end = new Date(start.getTime() + durationHours * 60 * 60 * 1000);

    const conflict = await Reservation.findOne({
      tableId: table._id,
      reservationDate: new Date(reservationDate),
      status: { $in: ["pending_payment", "paid", "confirmed"] },
      startTime: { $lt: end },
      endTime: { $gt: start },
    });

    if (conflict) return res.status(400).json({ message: "Table already reserved for this time slot" });

    const bookingCode = "BK" + Date.now().toString().slice(-4) + Math.floor(Math.random() * 1000);
    const tablePrice = table.price || 0;

    const reservation = await Reservation.create({
      userId,
      customerInfo: { fullName, phone, email },
      tableId: table._id,
      bookingCode,
      reservationDate: new Date(reservationDate),
      startTime: start,
      endTime: end,
      numberOfGuests: guests,
      note: note || "",
      tablePrice,
      totalAmount: tablePrice,
      status: "pending_payment",
    });

    return res.status(201).json({ message: "Reservation created successfully", reservation });
  } catch (error) {
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

exports.getMyReservations = async (req, res) => {
  try {
    const reservations = await Reservation.find({ userId: req.user.id })
      .populate("tableId", "tableNumber capacity location price")
      .sort({ reservationDate: -1 });
    return res.status(200).json({ total: reservations.length, reservations });
  } catch (error) {
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ================= USER REQUEST CANCEL (CHỈ GỬI YÊU CẦU) =================
exports.cancelReservation = async (req, res) => {
  try {
    const reservation = await Reservation.findById(req.params.id);
    if (!reservation) return res.status(404).json({ message: "Reservation not found" });

    if (String(reservation.userId) !== String(req.user?.id || req.user?._id)) {
      return res.status(403).json({ message: "You cannot cancel this reservation" });
    }

    const notAllowed = ["cancelled", "completed", "cancel_request"];
    if (notAllowed.includes(reservation.status)) {
      return res.status(400).json({ message: `Reservation is already ${reservation.status}` });
    }

    // Chuyển sang trạng thái chờ Admin duyệt hủy
    reservation.status = "cancel_request";
    await reservation.save();

    return res.status(200).json({
      message: "Cancellation request sent successfully. Waiting for Admin to process refund.",
      reservation
    });
  } catch (error) {
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

exports.getAllReservations = async (req, res) => {
  try {
    const reservations = await Reservation.find()
      .populate("userId", "fullName email")
      .populate("tableId", "tableNumber capacity location price")
      .sort({ reservationDate: -1 });
    return res.status(200).json({ total: reservations.length, reservations });
  } catch (error) {
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

exports.deleteReservation = async (req, res) => {
  try {
    const reservation = await Reservation.findById(req.params.id);
    if (!reservation) return res.status(404).json({ message: "Reservation not found" });
    if (String(reservation.userId) !== String(req.user?.id || req.user?._id) && req.user?.role !== "admin") {
      return res.status(403).json({ message: "No permission to delete" });
    }
    if (reservation.status !== "cancelled") return res.status(400).json({ message: "Only cancelled reservations can be deleted" });

    await Reservation.findByIdAndDelete(req.params.id);
    return res.status(200).json({ message: "Reservation deleted successfully" });
  } catch (error) {
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ================= ADMIN UPDATE STATUS (XỬ LÝ KHO & AUTO REFUND) =================
exports.updateReservationStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ["pending_payment", "paid", "confirmed", "completed", "cancelled", "cancel_request"];
    if (!validStatuses.includes(status)) return res.status(400).json({ message: "Invalid status" });

    const reservation = await Reservation.findById(id);
    if (!reservation) return res.status(404).json({ message: "Reservation not found" });

    const oldStatus = reservation.status;

    // 🔥 TRƯỜNG HỢP 1: ADMIN DUYỆT HỦY (Xử lý Refund & Hoàn kho)
    if (status === "cancelled" && oldStatus !== "cancelled") {

      // A. XỬ LÝ HOÀN TIỀN PAYPAL DỰA TRÊN THỜI GIAN
      if (oldStatus === "paid" || oldStatus === "confirmed" || oldStatus === "cancel_request") {
        const paymentDoc = await Payment.findOne({ reservationId: reservation._id, status: "paid" });

        if (paymentDoc && paymentDoc.transactionId) {
          const now = new Date();
          const startTime = new Date(reservation.startTime);
          const diffHours = (startTime - now) / (1000 * 60 * 60);

          let refundPercentage = 0;
          if (diffHours >= 48) refundPercentage = 1.0; // Trước 2 ngày: 100%
          else if (diffHours >= 24) refundPercentage = 0.8; // Trước 1 ngày: 80%
          else refundPercentage = 0; // Dưới 24h: 0%

          const refundAmount = paymentDoc.amount * refundPercentage;

          if (refundAmount > 0) {
            try {
              const request = new paypal.payments.CapturesRefundRequest(paymentDoc.transactionId);
              request.requestBody({
                amount: { value: refundAmount.toFixed(2), currency_code: "USD" }
              });
              await client.execute(request);
              paymentDoc.status = "refunded";
              await paymentDoc.save();
            } catch (refundError) {
              console.error("PayPal Refund Error:", refundError);
              // Không return lỗi ở đây để Admin vẫn có thể hủy đơn nếu PayPal gặp sự cố
            }
          }
        }
      }

      // B. HOÀN TRẢ KHO (Nếu đơn cũ đã ở trạng thái đã duyệt - confirmed)
      if (oldStatus === "confirmed") {
        const preorderDoc = await Preorder.findOne({ reservationId: id }).populate({
          path: "items.menuId",
          populate: { path: "ingredients.ingredientId" }
        });

        if (preorderDoc && preorderDoc.items) {
          for (const item of preorderDoc.items) {
            const menu = item.menuId;
            if (menu && menu.ingredients) {
              for (const ing of menu.ingredients) {
                if (ing.ingredientId) {
                  const requiredQuantity = ing.quantity * item.quantity;
                  await Inventory.findByIdAndUpdate(ing.ingredientId._id, { $inc: { quantity: requiredQuantity } });
                }
              }
            }
          }
        }
      }
    }

    // 🔥 TRƯỜNG HỢP 2: ADMIN DUYỆT ĐƠN (Chuyển sang confirmed -> TRỪ KHO)
    if ((oldStatus === "pending_payment" || oldStatus === "paid") && status === "confirmed") {
      const preorderDoc = await Preorder.findOne({ reservationId: id }).populate({
        path: "items.menuId",
        populate: { path: "ingredients.ingredientId" }
      });

      if (preorderDoc && preorderDoc.items) {
        // 1. Kiểm tra kho
        for (const item of preorderDoc.items) {
          const menu = item.menuId;
          if (menu && menu.ingredients) {
            for (const ing of menu.ingredients) {
              const inventoryItem = ing.ingredientId;
              if (!inventoryItem) continue;
              const requiredQuantity = ing.quantity * item.quantity;
              if (inventoryItem.quantity < requiredQuantity) {
                return res.status(400).json({
                  message: `Cannot confirm! Not enough ${inventoryItem.name} in stock.`
                });
              }
            }
          }
        }
        // 2. Trừ kho
        for (const item of preorderDoc.items) {
          const menu = item.menuId;
          if (menu && menu.ingredients) {
            for (const ing of menu.ingredients) {
              const inventoryItem = ing.ingredientId;
              if (inventoryItem) {
                const requiredQuantity = ing.quantity * item.quantity;
                await Inventory.findByIdAndUpdate(inventoryItem._id, { $inc: { quantity: -requiredQuantity } });
              }
            }
          }
        }
      }
    }

    reservation.status = status;
    await reservation.save();

    return res.status(200).json({ message: `Status updated to ${status} successfully`, reservation });
  } catch (error) {
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};