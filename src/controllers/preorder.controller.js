const Preorder = require("../models/Preorder");
const Menu = require("../models/Menu");
const Reservation = require("../models/Reservation");
const Inventory = require("../models/Inventory");

// ================= CREATE PREORDER =================
exports.createPreorder = async (req, res) => {
  try {
    const { reservationId, items } = req.body;

    if (!reservationId || !items || items.length === 0) {
      return res.status(400).json({ message: "Missing reservationId or items" });
    }

    const reservation = await Reservation.findById(reservationId);
    if (!reservation) return res.status(404).json({ message: "Reservation not found" });

    // 🔥 KIỂM TRA TRẠNG THÁI: Chỉ cho phép đặt món khi đơn đang ở trạng thái chờ thanh toán
    if (reservation.status !== "pending_payment") {
      return res.status(400).json({ message: "Cannot modify preorder after payment or confirmation" });
    }

    const currentUserId = String(req.user?.id || req.user?._id);
    const ownerId = String(reservation.userId);

    if (ownerId !== currentUserId) {
      return res.status(403).json({
        message: "You cannot preorder for this reservation",
        debug: { ownerId, currentUserId }
      });
    }

    const existingPreorder = await Preorder.findOne({ reservationId });
    if (existingPreorder) {
      return res.status(400).json({ message: "Preorder already exists for this reservation" });
    }

    let totalAmount = 0;
    const orderItems = [];

    for (const item of items) {
      const menu = await Menu.findById(item.menuId).populate("ingredients.ingredientId");

      if (!menu || !menu.isAvailable) {
        return res.status(404).json({ message: "Menu item not available" });
      }

      totalAmount += menu.price * item.quantity;

      // 🔥 CHỈ KIỂM TRA KHO (KHÔNG TRỪ KHO Ở ĐÂY NỮA)
      for (const ing of menu.ingredients) {
        const inventoryItem = ing.ingredientId;
        const required = ing.quantity * item.quantity;

        if (inventoryItem.quantity < required) {
          return res.status(400).json({ message: `Not enough ${inventoryItem.name} in stock` });
        }
      }

      orderItems.push({
        menuId: menu._id,
        quantity: item.quantity,
        price: menu.price,
      });
    }

    const preorder = await Preorder.create({
      reservationId,
      items: orderItems,
      totalAmount,
    });

    // 🔥 CẬP NHẬT QUAN TRỌNG: Cộng dồn tiền món ăn vào tổng tiền của Đơn đặt bàn
    reservation.totalAmount += totalAmount;
    await reservation.save();

    res.status(201).json({
      message: "Preorder created successfully",
      preorder,
      newTotalReservationAmount: reservation.totalAmount // Trả về để Frontend lấy đem đi gọi PayPal
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ================= GET PREORDER BY RESERVATION =================
exports.getPreorderByReservation = async (req, res) => {
  try {
    const { reservationId } = req.params;
    const preorder = await Preorder.findOne({ reservationId })
      .populate("items.menuId", "name price image");

    if (!preorder) {
      return res.status(200).json({
        message: "No preorder found for this reservation",
        preorder: { items: [], totalAmount: 0 }
      });
    }
    res.status(200).json({ preorder });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ================= UPDATE PREORDER STATUS =================
exports.updatePreorderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const validStatus = ["received", "preparing", "ready", "cancelled"];

    if (!validStatus.includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const preorder = await Preorder.findByIdAndUpdate(id, { status }, { new: true });
    if (!preorder) return res.status(404).json({ message: "Preorder not found" });

    res.status(200).json({ message: "Preorder status updated", preorder });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};