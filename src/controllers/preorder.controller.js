const Preorder = require("../models/Preorder");
const Menu = require("../models/Menu");
const Reservation = require("../models/Reservation");
const Inventory = require("../models/Inventory");


// ================= CREATE PREORDER =================
exports.createPreorder = async (req, res) => {
  try {

    const { reservationId, items } = req.body;

    if (!reservationId || !items || items.length === 0) {
      return res.status(400).json({
        message: "Missing reservationId or items",
      });
    }

    const reservation = await Reservation.findById(reservationId);

    if (!reservation) {
      return res.status(404).json({
        message: "Reservation not found",
      });
    }

    if (reservation.userId.toString() !== req.user.id) {
      return res.status(403).json({
        message: "You cannot preorder for this reservation",
      });
    }

    const existingPreorder = await Preorder.findOne({ reservationId });

    if (existingPreorder) {
      return res.status(400).json({
        message: "Preorder already exists for this reservation",
      });
    }

    let totalAmount = 0;
    const orderItems = [];

  for (const item of items) {
    const menu = await Menu.findById(item.menuId)
    .populate("ingredients.ingredientId");

    if (!menu || !menu.isAvailable) {
      return res.status(404).json({
        message: "Menu item not available",
      });
    }

    const subtotal = menu.price * item.quantity;
    totalAmount += subtotal;

    // 🔥 TRỪ INVENTORY
    for (const ing of menu.ingredients) {

    const inventoryItem = ing.ingredientId;

    const required = ing.quantity * item.quantity;

    if (inventoryItem.quantity < required) {
      return res.status(400).json({
        message: `Not enough ${inventoryItem.name}`,
      });
    }

    inventoryItem.quantity -= required;
    await inventoryItem.save();
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

    res.status(201).json({
      message: "Preorder created successfully",
      preorder,
    });

  } catch (error) {

    res.status(500).json({
      message: "Server error",
      error: error.message,
    });

  }
};



// ================= GET PREORDER BY RESERVATION =================
exports.getPreorderByReservation = async (req, res) => {
  try {

    const { reservationId } = req.params;

    const preorder = await Preorder.findOne({ reservationId })
      .populate("items.menuId", "name price image");

    if (!preorder) {
      return res.status(404).json({
        message: "Preorder not found",
      });
    }

    res.status(200).json({
      preorder,
    });

  } catch (error) {
    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};



// ================= UPDATE PREORDER STATUS =================
exports.updatePreorderStatus = async (req, res) => {
  try {

    const { id } = req.params;
    const { status } = req.body;

    const validStatus = ["received", "preparing", "ready", "cancelled"];

    if (!validStatus.includes(status)) {
      return res.status(400).json({
        message: "Invalid status",
      });
    }

    const preorder = await Preorder.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    );

    if (!preorder) {
      return res.status(404).json({
        message: "Preorder not found",
      });
    }

    res.status(200).json({
      message: "Preorder status updated",
      preorder,
    });

  } catch (error) {

    res.status(500).json({
      message: "Server error",
      error: error.message,
    });

  }
};