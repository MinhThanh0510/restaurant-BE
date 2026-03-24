const Inventory = require("../models/Inventory");

// [GET] Lấy tất cả nguyên liệu trong kho
exports.getAllInventory = async (req, res) => {
  try {
    // Sắp xếp mới nhất lên đầu
    const inventory = await Inventory.find().sort({ createdAt: -1 });
    res.status(200).json({ inventory });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// [POST] Thêm nguyên liệu mới
exports.createInventoryItem = async (req, res) => {
  try {
    const { name, quantity, unit } = req.body;

    if (!name || quantity === undefined || !unit) {
      return res.status(400).json({ message: "Name, quantity, and unit are required" });
    }

    const newItem = await Inventory.create({ name, quantity, unit });
    res.status(201).json({ 
      message: "Inventory item added successfully", 
      item: newItem 
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// [PUT] Cập nhật thông tin/số lượng nguyên liệu
exports.updateInventoryItem = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, quantity, unit } = req.body;

    const item = await Inventory.findByIdAndUpdate(
      id,
      { name, quantity, unit },
      { new: true, runValidators: true }
    );

    if (!item) {
      return res.status(404).json({ message: "Inventory item not found" });
    }

    res.status(200).json({ 
      message: "Inventory item updated successfully", 
      item 
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// [DELETE] Xóa nguyên liệu khỏi kho
exports.deleteInventoryItem = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Lưu ý: Nếu nguyên liệu này đang được dùng trong Món Ăn (Menu),
    // khi xóa đi thì lúc Edit món ăn Frontend sẽ báo "⚠️ Deleted from stock" 
    // (như mình đã code bọc thép ở phần trước).
    const item = await Inventory.findByIdAndDelete(id);

    if (!item) {
      return res.status(404).json({ message: "Inventory item not found" });
    }

    res.status(200).json({ message: "Inventory item deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};