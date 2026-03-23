const MenuCategory = require("../models/MenuCategory");

// 1. LẤY TẤT CẢ DANH MỤC
exports.getAllCategories = async (req, res) => {
  try {
    const categories = await MenuCategory.find().sort({ createdAt: -1 });
    res.status(200).json({ categories });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// 2. THÊM DANH MỤC MỚI
exports.createCategory = async (req, res) => {
  try {
    const { name, description } = req.body;
    if (!name) return res.status(400).json({ message: "Category name is required" });

    const category = await MenuCategory.create({ name, description });
    res.status(201).json({ message: "Category created successfully", category });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// 3. CẬP NHẬT DANH MỤC
exports.updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;

    const category = await MenuCategory.findByIdAndUpdate(
      id,
      { name, description },
      { new: true }
    );

    if (!category) return res.status(404).json({ message: "Category not found" });

    res.status(200).json({ message: "Category updated successfully", category });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// 4. XÓA DANH MỤC
exports.deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;
    // Lưu ý: Trong thực tế, bạn nên kiểm tra xem có Món ăn nào đang thuộc Category này không trước khi xóa
    await MenuCategory.findByIdAndDelete(id);
    res.status(200).json({ message: "Category deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};