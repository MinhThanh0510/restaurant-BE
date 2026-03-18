const mongoose = require("mongoose");

const inventorySchema = new mongoose.Schema({
  name: { type: String, required: true }, // eggs, beef
  quantity: { type: Number, required: true },
});

module.exports = mongoose.model("Inventory", inventorySchema);