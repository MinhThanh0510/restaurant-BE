const mongoose = require("mongoose");

const inventorySchema = new mongoose.Schema(
  {
    name: { 
      type: String, 
      required: true,
      trim: true
    }, // VD: Beef, Eggs, Milk
    quantity: { 
      type: Number, 
      required: true,
      min: 0 // Số lượng không được âm
    },
    unit: { 
      type: String, 
      required: true,
      trim: true
    }, // VD: kg, g, pcs, liters
  },
  { 
    timestamps: true // Tự động thêm createdAt và updatedAt
  }
);

module.exports = mongoose.model("Inventory", inventorySchema);