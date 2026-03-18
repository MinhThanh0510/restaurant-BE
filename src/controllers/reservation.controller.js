const Reservation = require("../models/Reservation");
const Table = require("../models/Table");
const mongoose = require("mongoose");
const Menu = require("../models/Menu");
const Inventory = require("../models/Inventory");

exports.createReservation = async (req, res) => {
  try {
    const {
      tableId,
      reservationDate,
      startTime,
      numberOfGuests,
      note,
      fullName,
      phone,
      email,
      preorderItems,
    } = req.body;

    const userId = req.user?.id;

    // ===== VALIDATE =====
    if (!tableId || !reservationDate || !startTime || !numberOfGuests) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const table = await Table.findById(tableId);
    if (!table) {
      return res.status(404).json({ message: "Table not found" });
    }

    const guests = Number(numberOfGuests);
    if (guests <= 0 || guests > table.capacity) {
      return res.status(400).json({
        message: `Guests must be between 1 and ${table.capacity}`,
      });
    }

    // ===== TIME =====
    const start = new Date(`${reservationDate}T${startTime}:00`);
    const durationHours = guests > 6 ? 3.5 : 2.5;
    const end = new Date(start.getTime() + durationHours * 60 * 60 * 1000);

    // ===== CHECK CONFLICT =====
    const conflict = await Reservation.findOne({
      tableId: table._id,
      reservationDate: new Date(reservationDate),
      status: { $in: ["pending", "confirmed"] },
      startTime: { $lt: end },
      endTime: { $gt: start },
    });

    if (conflict) {
      return res.status(400).json({
        message: "Table already reserved",
      });
    }

    // ===== 🔥 PREORDER + INVENTORY =====
let preorder = [];
let preorderTotal = 0;

if (preorderItems && preorderItems.length > 0) {

  for (const item of preorderItems) {

    const menu = await Menu.findById(item.menuId)
      .populate("ingredients.ingredientId");

    if (!menu || !menu.isAvailable) {
      return res.status(404).json({
        message: "Menu not available",
      });
    }

    console.log("MENU:", menu.name);
    console.log("INGREDIENTS:", menu.ingredients);

    const subtotal = menu.price * item.quantity;
    preorderTotal += subtotal;

    // 🔥 CHECK + TRỪ INVENTORY
    for (const ing of menu.ingredients) {

      // ❌ FIX LỖI NULL
      if (!ing.ingredientId) {
        return res.status(500).json({
          message: "IngredientId is NULL → data lỗi trong Menu",
        });
      }

      const inventoryItem = ing.ingredientId;
      const required = ing.quantity * item.quantity;

      // ❌ CHECK tồn kho
      if (inventoryItem.quantity < required) {
        return res.status(400).json({
          message: `Not enough ${inventoryItem.name}`,
        });
      }

      // 👉 TRỪ
      const updated = await Inventory.findOneAndUpdate(
      {
        _id: inventoryItem._id,
        quantity: { $gte: required }
      },
      {
        $inc: { quantity: -required }
      },
      { new: true }
    );

    if (!updated) {
      return res.status(400).json({
      message: `Not enough ${inventoryItem.name}`,
    });
  }
    }

    preorder.push({
      menuId: menu._id,
      quantity: item.quantity,
      price: menu.price,
    });
  }
}

    // ===== CREATE =====
    const bookingCode =
      "BK" + Date.now() + Math.floor(Math.random() * 1000);

    const reservation = await Reservation.create({
      userId,
      customerInfo: {
        fullName,
        phone,
        email,
      },
      tableId: table._id,
      bookingCode,
      reservationDate: new Date(reservationDate),
      startTime: start,
      endTime: end,
      numberOfGuests: guests,
      note: note || "",
      preorder,
      preorderTotal,
      status: "pending",
    });

    res.status(201).json({
      message: "Reservation created successfully",
      reservation,
    });
  } catch (error) {
    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};

exports.getMyReservations = async (req, res) => {
  try {

    const userId = req.user.id;

    const reservations = await Reservation.find({ userId })
      .populate("tableId")
      .populate("preorder.menuId", "name price image")
      .sort({ reservationDate: -1 });

    return res.status(200).json({
      message: "My reservations",
      total: reservations.length,
      reservations,
    });

  } catch (error) {
    return res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};

exports.cancelReservation = async (req, res) => {
  try {

    const { id } = req.params;
    const userId = req.user.id;

    const reservation = await Reservation.findById(id);

    if (!reservation) {
      return res.status(404).json({
        message: "Reservation not found",
      });
    }

    // Chỉ cho hủy của chính mình
    if (reservation.userId.toString() !== userId) {
      return res.status(403).json({
        message: "You cannot cancel this reservation",
      });
    }

    if (reservation.status === "cancelled") {
      return res.status(400).json({
        message: "Reservation already cancelled",
      });
    }

    reservation.status = "cancelled";
    await reservation.save();

    return res.status(200).json({
      message: "Reservation cancelled successfully",
      reservation,
    });

  } catch (error) {
    return res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};

exports.getAllReservations = async (req, res) => {
  try {

    const reservations = await Reservation.find()
      .populate("userId", "name email")
      .populate("tableId", "tableNumber capacity")
      .sort({ reservationDate: -1 });

    return res.status(200).json({
      message: "All reservations",
      total: reservations.length,
      reservations,
    });

  } catch (error) {
    return res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};