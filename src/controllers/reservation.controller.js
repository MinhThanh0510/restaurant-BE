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
      // Duyệt qua từng món ăn khách đặt
      for (const item of preorderItems) {
        const menu = await Menu.findById(item.menuId).populate("ingredients.ingredientId");

        if (!menu || !menu.isAvailable) {
          return res.status(404).json({
            message: `Menu item with ID ${item.menuId} is not available`,
          });
        }

        const subtotal = menu.price * item.quantity;
        preorderTotal += subtotal;

        // Xử lý trừ nguyên liệu trong kho
        if (menu.ingredients && menu.ingredients.length > 0) {
          for (const ing of menu.ingredients) {
            if (!ing.ingredientId) {
              return res.status(500).json({
                message: `Data error: Ingredient ID missing for menu ${menu.name}`,
              });
            }

            const inventoryItem = ing.ingredientId;
            const requiredQuantity = ing.quantity * item.quantity;

            // Kiểm tra số lượng tồn kho trước
            if (inventoryItem.quantity < requiredQuantity) {
              return res.status(400).json({
                message: `Not enough ${inventoryItem.name} in inventory to make ${menu.name}`,
              });
            }

            // Thực hiện trừ kho trực tiếp
            const updatedInventory = await Inventory.findOneAndUpdate(
              {
                _id: inventoryItem._id,
                quantity: { $gte: requiredQuantity } // Make sure no other request took it
              },
              {
                $inc: { quantity: -requiredQuantity } // Trừ đi số lượng
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

        // Đẩy món ăn vào mảng preorder để lưu vào Reservation
        preorder.push({
          menuId: menu._id,
          quantity: item.quantity,
          price: menu.price,
        });
      }
    }

    // ===== TẠO ĐƠN ĐẶT BÀN =====
    const bookingCode = "BK" + Date.now().toString().slice(-4) + Math.floor(Math.random() * 1000);

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
      preorder,       // Lưu danh sách món
      preorderTotal,  // Lưu tổng tiền
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

// ... Các hàm GET, CANCEL bên dưới của bạn giữ nguyên, KHÔNG CẦN THAY ĐỔI
exports.getMyReservations = async (req, res) => {
  try {
    const userId = req.user.id;
    const reservations = await Reservation.find({ userId })
      .populate("tableId")
      // .populate("preorder.menuId", "name price image")
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

// ================= CANCEL RESERVATION =================
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

// ================= DELETE RESERVATION (ONLY CANCELLED) =================
exports.deleteReservation = async (req, res) => {
  try {
    const { id } = req.params;
    const currentUserId = String(req.user?.id || req.user?._id);

    // 1. Tìm reservation
    const reservation = await Reservation.findById(id);

    if (!reservation) {
      return res.status(404).json({ message: "Reservation not found" });
    }

    // 2. Kiểm tra quyền sở hữu (chỉ cho phép user tự xóa hoặc Admin xóa)
    const ownerId = String(reservation.userId);
    const userRole = req.user?.role; // Giả sử trong req.user có chứa role

    if (ownerId !== currentUserId && userRole !== "admin") {
      return res.status(403).json({
        message: "You do not have permission to delete this reservation",
      });
    }

    // 3. Kiểm tra điều kiện xóa: Chỉ được xóa khi status là 'cancelled'
    if (reservation.status !== "cancelled") {
      return res.status(400).json({
        message: "Only cancelled reservations can be deleted",
      });
    }

    // 4. Thực hiện xóa khỏi Database
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

// ================= ADMIN CẬP NHẬT TRẠNG THÁI =================
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