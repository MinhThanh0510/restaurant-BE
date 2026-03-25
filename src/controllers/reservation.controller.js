const Reservation = require("../models/Reservation");
const Table = require("../models/Table");
const Inventory = require("../models/Inventory");
const Preorder = require("../models/Preorder"); // 🔥 Cần Import Model này vào

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
      status: { $in: ["pending", "confirmed"] },
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
      totalAmount: tablePrice, // Mới tạo thì tổng tiền tạm = tiền bàn (tiền món ăn sẽ cập nhật sau)
      status: "pending",
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

// ================= CUSTOMER CANCEL (HOÀN KHO NẾU ĐÃ CONFIRM) =================
exports.cancelReservation = async (req, res) => {
  try {
    const reservation = await Reservation.findById(req.params.id);
    if (!reservation) return res.status(404).json({ message: "Reservation not found" });

    if (String(reservation.userId) !== String(req.user?.id || req.user?._id)) {
      return res.status(403).json({ message: "You cannot cancel this reservation" });
    }
    if (reservation.status === "cancelled") return res.status(400).json({ message: "Already cancelled" });

    // 🔥 HOÀN TRẢ KHO (Tìm trong bảng Preorder)
    if (reservation.status === "confirmed") {
      const preorderDoc = await Preorder.findOne({ reservationId: reservation._id }).populate({
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

    reservation.status = "cancelled";
    await reservation.save();
    return res.status(200).json({ message: "Reservation cancelled successfully", reservation });
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

// ================= ADMIN UPDATE STATUS (XỬ LÝ KHO) =================
exports.updateReservationStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ["pending", "confirmed", "completed", "cancelled"];
    if (!validStatuses.includes(status)) return res.status(400).json({ message: "Invalid status" });

    const reservation = await Reservation.findById(id);
    if (!reservation) return res.status(404).json({ message: "Reservation not found" });

    const oldStatus = reservation.status;

    // 🔥 Tìm danh sách món ăn từ bảng Preorder
    const preorderDoc = await Preorder.findOne({ reservationId: id }).populate({
      path: "items.menuId",
      populate: { path: "ingredients.ingredientId" }
    });

    // 🔥 PENDING -> CONFIRMED (TRỪ KHO)
    if (oldStatus === "pending" && status === "confirmed") {
      if (preorderDoc && preorderDoc.items) {
        // 1. Kiểm tra kho trước
        for (const item of preorderDoc.items) {
          const menu = item.menuId;
          if (menu && menu.ingredients) {
            for (const ing of menu.ingredients) {
              const inventoryItem = ing.ingredientId;
              if (!inventoryItem) continue;
              const requiredQuantity = ing.quantity * item.quantity;
              
              if (inventoryItem.quantity < requiredQuantity) {
                return res.status(400).json({
                  message: `Cannot confirm! Not enough ${inventoryItem.name} in inventory. Needs ${requiredQuantity}, has ${inventoryItem.quantity}.`
                });
              }
            }
          }
        }
        // 2. Tiến hành trừ kho
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

    // 🔥 CONFIRMED/COMPLETED -> CANCELLED (HOÀN KHO)
    if ((oldStatus === "confirmed" || oldStatus === "completed") && status === "cancelled") {
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

    reservation.status = status;
    await reservation.save();

    return res.status(200).json({ message: `Status updated to ${status}`, reservation });
  } catch (error) {
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};