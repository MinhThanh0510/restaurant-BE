const Reservation = require("../models/Reservation");
const Table = require("../models/Table");
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

    // ===== VALIDATE CƠ BẢN =====
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

    // ===== TÍNH TOÁN THỜI GIAN =====
    const start = new Date(`${reservationDate}T${startTime}:00`);
    const durationHours = guests > 6 ? 3.5 : 2.5;
    const end = new Date(start.getTime() + durationHours * 60 * 60 * 1000);

    // ===== CHECK BÀN ĐÃ BỊ ĐẶT CHƯA =====
    const conflict = await Reservation.findOne({
      tableId: table._id,
      reservationDate: new Date(reservationDate),
      status: { $in: ["pending", "confirmed"] },
      startTime: { $lt: end },
      endTime: { $gt: start },
    });

    if (conflict) {
      return res.status(400).json({
        message: "Table already reserved for this time slot",
      });
    }

    // ===== XỬ LÝ PREORDER VÀ TRỪ KHO (INVENTORY) =====
    let preorder = [];
    let preorderTotal = 0;

    if (preorderItems && preorderItems.length > 0) {
      for (const item of preorderItems) {
        const menu = await Menu.findById(item.menuId).populate("ingredients.ingredientId");

        if (!menu || !menu.isAvailable) {
          return res.status(404).json({
            message: `Menu item with ID ${item.menuId} is not available`,
          });
        }

        const subtotal = menu.price * item.quantity;
        preorderTotal += subtotal;

        if (menu.ingredients && menu.ingredients.length > 0) {
          for (const ing of menu.ingredients) {
            if (!ing.ingredientId) {
              return res.status(500).json({
                message: `Data error: Ingredient ID missing for menu ${menu.name}`,
              });
            }

            const inventoryItem = ing.ingredientId;
            const requiredQuantity = ing.quantity * item.quantity;

            if (inventoryItem.quantity < requiredQuantity) {
              return res.status(400).json({
                message: `Not enough ${inventoryItem.name} in inventory to make ${menu.name}`,
              });
            }

            const updatedInventory = await Inventory.findOneAndUpdate(
              {
                _id: inventoryItem._id,
                quantity: { $gte: requiredQuantity }
              },
              {
                $inc: { quantity: -requiredQuantity }
              },
              { new: true }
            );

            if (!updatedInventory) {
              return res.status(400).json({
                message: `Concurrency error: Failed to deduct ${inventoryItem.name} from inventory. Please try again.`,
              });
            }
          }
        }

        preorder.push({
          menuId: menu._id,
          quantity: item.quantity,
          price: menu.price,
        });
      }
    }

    // ===== TẠO ĐƠN ĐẶT BÀN VÀ TÍNH TIỀN =====
    const bookingCode = "BK" + Date.now().toString().slice(-4) + Math.floor(Math.random() * 1000);

    // 🔥 Lấy giá bàn tại thời điểm đặt (nếu ko có mặc định là 0)
    const tablePrice = table.price || 0;
    
    // 🔥 Tổng tiền = Tiền đồ ăn + Tiền phụ thu bàn
    const totalAmount = preorderTotal + tablePrice;

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
      preorder,
      preorderTotal,
      tablePrice,    // 🔥 Lưu giá bàn
      totalAmount,   // 🔥 Lưu tổng thanh toán
      status: "pending",
    });

    return res.status(201).json({
      message: "Reservation created successfully",
      reservation,
    });
  } catch (error) {
    console.error("Create Reservation Error:", error);
    return res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};

exports.getMyReservations = async (req, res) => {
  try {
    const userId = req.user.id;
    const reservations = await Reservation.find({ userId })
      // 🔥 Lấy thêm location và price của bàn để hiển thị cho Khách hàng
      .populate("tableId", "tableNumber capacity location price")
      .sort({ reservationDate: -1 });

    return res.status(200).json({
      message: "My reservations",
      total: reservations.length,
      reservations,
    });
  } catch (error) {
    console.error("getMyReservations Error:", error);
    return res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};

exports.cancelReservation = async (req, res) => {
  try {
    const { id } = req.params;
    const currentUserId = String(req.user?.id || req.user?._id);
    const reservation = await Reservation.findById(id);

    if (!reservation) {
      return res.status(404).json({ message: "Reservation not found" });
    }

    const ownerId = String(reservation.userId);

    if (ownerId !== currentUserId) {
      return res.status(403).json({
        message: "You cannot cancel this reservation",
      });
    }

    if (reservation.status === "cancelled") {
      return res.status(400).json({ message: "Reservation already cancelled" });
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
      .populate("userId", "fullName email")
      // 🔥 Lấy thêm location và price của bàn để hiển thị cho Admin
      .populate("tableId", "tableNumber capacity location price")
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

exports.deleteReservation = async (req, res) => {
  try {
    const { id } = req.params;
    const currentUserId = String(req.user?.id || req.user?._id);
    const reservation = await Reservation.findById(id);

    if (!reservation) {
      return res.status(404).json({ message: "Reservation not found" });
    }

    const ownerId = String(reservation.userId);
    const userRole = req.user?.role;

    if (ownerId !== currentUserId && userRole !== "admin") {
      return res.status(403).json({
        message: "You do not have permission to delete this reservation",
      });
    }

    if (reservation.status !== "cancelled") {
      return res.status(400).json({
        message: "Only cancelled reservations can be deleted",
      });
    }

    await Reservation.findByIdAndDelete(id);

    return res.status(200).json({
      message: "Reservation history deleted successfully",
    });
  } catch (error) {
    console.error("Delete Reservation Error:", error);
    return res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};

exports.updateReservationStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ["pending", "confirmed", "completed", "cancelled"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: "Trạng thái không hợp lệ" });
    }

    const reservation = await Reservation.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    );

    if (!reservation) {
      return res.status(404).json({ message: "Không tìm thấy đơn đặt bàn" });
    }

    return res.status(200).json({
      message: "Cập nhật trạng thái thành công",
      reservation
    });
  } catch (error) {
    return res.status(500).json({
      message: "Lỗi Server",
      error: error.message
    });
  }
};