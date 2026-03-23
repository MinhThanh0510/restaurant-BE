const Inventory = require("../models/Inventory");

exports.getAllInventory = async (req, res) => {
  try {
    const inventory = await Inventory.find();
    res.status(200).json({ inventory });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};