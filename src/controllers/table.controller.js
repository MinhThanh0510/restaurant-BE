const Table = require("../models/Table");
const Reservation = require("../models/Reservation");

// ================= GET ALL TABLES =================
exports.getAllTables = async (req, res) => {
  try {
    const tables = await Table.find().sort({ tableNumber: 1 });

    return res.status(200).json({
      message: "Get tables successfully",
      tables,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};


// ================= CREATE TABLE (ADMIN) =================
exports.createTable = async (req, res) => {
  try {
    const { tableNumber, capacity } = req.body;

    if (!tableNumber || !capacity) {
      return res.status(400).json({
        message: "tableNumber and capacity are required",
      });
    }

    const existingTable = await Table.findOne({ tableNumber });

    if (existingTable) {
      return res.status(400).json({
        message: "Table already exists",
      });
    }

    const table = await Table.create({
      tableNumber,
      capacity,
    });

    return res.status(201).json({
      message: "Table created successfully",
      table,
    });

  } catch (error) {
    return res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};


// ================= UPDATE TABLE (ADMIN) =================
exports.updateTable = async (req, res) => {
  try {
    const { id } = req.params;

    const table = await Table.findByIdAndUpdate(
      id,
      req.body,
      { new: true }
    );

    if (!table) {
      return res.status(404).json({
        message: "Table not found",
      });
    }

    return res.status(200).json({
      message: "Table updated successfully",
      table,
    });

  } catch (error) {
    return res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};

exports.deleteTable = async (req, res) => {
  try {
    const { id } = req.params;

    const table = await Table.findByIdAndDelete(id);

    if (!table) {
      return res.status(404).json({
        message: "Table not found",
      });
    }

    return res.status(200).json({
      message: "Table deleted successfully",
    });

  } catch (error) {
    return res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};


// ================= DELETE TABLE (ADMIN) =================
exports.deleteTable = async (req, res) => {
  try {
    const { id } = req.params;

    const table = await Table.findByIdAndDelete(id);

    if (!table) {
      return res.status(404).json({
        message: "Table not found",
      });
    }

    return res.status(200).json({
      message: "Table deleted successfully",
    });

  } catch (error) {
    return res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};

exports.getAvailableTables = async (req, res) => {
  try {
    const { date, time, guests } = req.query;

    if (!date || !time) {
      return res.status(400).json({
        message: "date and time are required",
      });
    }

    const start = new Date(`${date}T${time}:00`);
    const end = new Date(start.getTime() + 2.5 * 60 * 60 * 1000);

    const reservations = await Reservation.find({
      reservationDate: new Date(date),
      status: { $in: ["pending", "confirmed"] },
      startTime: { $lt: end },
      endTime: { $gt: start },
    });

    const reservedTableIds = reservations.map(r => r.tableId);

    const filter = {
      _id: { $nin: reservedTableIds },
      status: "available",
    };

    if (guests) {
      filter.capacity = { $gte: Number(guests) };
    }

    const tables = await Table.find(filter).sort({ tableNumber: 1 });

    return res.status(200).json({
      message: "Available tables",
      total: tables.length,
      tables,
    });

  } catch (error) {
    return res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};

exports.updateTable = async (req, res) => {
  try {
    const { id } = req.params;

    const table = await Table.findByIdAndUpdate(
      id,
      req.body,
      { new: true }
    );

    if (!table) {
      return res.status(404).json({
        message: "Table not found",
      });
    }

    return res.status(200).json({
      message: "Table updated successfully",
      table,
    });

  } catch (error) {
    return res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};

exports.deleteTable = async (req, res) => {
  try {
    const { id } = req.params;

    const table = await Table.findByIdAndDelete(id);

    if (!table) {
      return res.status(404).json({
        message: "Table not found",
      });
    }

    return res.status(200).json({
      message: "Table deleted successfully",
    });

  } catch (error) {
    return res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};

exports.getTablesAvailability = async (req, res) => {
  try {
    const { date, guests } = req.query;

    if (!date) {
      return res.status(400).json({
        message: "date is required",
      });
    }

    const Reservation = require("../models/Reservation");

    // khung giờ nhà hàng
    const timeSlots = [
      "17:00",
      "17:30",
      "18:00",
      "18:30",
      "19:00",
      "19:30",
      "20:00",
      "20:30",
      "21:00",
    ];

    let tablesQuery = { status: "available" };

    if (guests) {
      tablesQuery.capacity = { $gte: Number(guests) };
    }

    const tables = await Table.find(tablesQuery).sort({ tableNumber: 1 });

    const reservations = await Reservation.find({
      reservationDate: new Date(date),
      status: { $in: ["pending", "confirmed"] },
    });

    const result = [];

    for (const table of tables) {

      const tableReservations = reservations.filter(
        (r) => r.tableId.toString() === table._id.toString()
      );

      const availableSlots = [];

      for (const slot of timeSlots) {

        const start = new Date(`${date}T${slot}:00`);
        const end = new Date(start.getTime() + 2.5 * 60 * 60 * 1000);

        const conflict = tableReservations.find(
          (r) => r.startTime < end && r.endTime > start
        );

        if (!conflict) {
          availableSlots.push(slot);
        }
      }

      result.push({
        tableId: table._id,
        tableNumber: table.tableNumber,
        capacity: table.capacity,
        availableSlots,
      });
    }

    return res.status(200).json({
      date,
      tables: result,
    });

  } catch (error) {
    return res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};