const Menu = require("../models/Menu");
const MenuCategory = require("../models/MenuCategory");

// ================= GET ALL MENUS =================
exports.getAllMenus = async (req, res) => {
  try {
    const categories = await MenuCategory.find();

    const result = [];

    for (const category of categories) {
      const menus = await Menu.find({
        categoryId: category._id,
        isAvailable: true,
      }).populate("ingredients.ingredientId", "name");

      result.push({
        categoryId: category._id,
        categoryName: category.name,
        items: menus,
      });
    }

    res.status(200).json({
      message: "Get menus by category successfully",
      data: result,
    });

  } catch (error) {
    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};

// ================= GET ALL MENUS (ADMIN) =================
exports.getAllAdminMenus = async (req, res) => {
  try {
    // Lấy tất cả món ăn (kể cả hết hàng), xuất ra mảng phẳng, kèm tên danh mục
    const menus = await Menu.find()
      .populate("categoryId", "name")
      .populate("ingredients.ingredientId", "name")
      .sort({ createdAt: -1 });

    res.status(200).json({
      message: "Get all menus for admin successfully",
      menus,
    });
  } catch (error) {
    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};


// ================= GET MENU BY CATEGORY =================
exports.getMenuByCategory = async (req, res) => {
  try {
    const { categoryId } = req.params;

    const category = await MenuCategory.findById(categoryId);

    if (!category) {
      return res.status(404).json({
        message: "Category not found",
      });
    }

    const menus = await Menu.find({
      categoryId,
      isAvailable: true,
    })
    .select("name price image isAvailable ingredients");

    res.status(200).json({
      category: category.name,
      total: menus.length,
      menus,
    });

  } catch (error) {
    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};


// ================= GET MENU DETAIL =================
exports.getMenuDetail = async (req, res) => {
  try {
    const { id } = req.params;

    const menu = await Menu.findById(id)
      .populate("categoryId", "name")
      .populate("ingredients.ingredientId", "name");

    if (!menu) {
      return res.status(404).json({
        message: "Menu not found",
      });
    }

    res.status(200).json({
      message: "Get menu detail successfully",
      menu: {
        id: menu._id,
        name: menu.name,
        description: menu.description,
        price: menu.price,
        image: menu.image,
        isAvailable: menu.isAvailable,
        category: menu.categoryId?.name,
        ingredients: menu.ingredients,
      },
    });

  } catch (error) {
    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};


// ================= CREATE MENU (ADMIN) =================
exports.createMenu = async (req, res) => {
  try {
    // 🔥 FIX: Thêm ingredients và isAvailable vào mảng bóc tách
    const { name, description, price, image, categoryId, ingredients, isAvailable } = req.body;

    if (!name || !price || !categoryId) {
      return res.status(400).json({
        message: "Name, price and categoryId are required",
      });
    }

    const menu = await Menu.create({
      name,
      description,
      price,
      image,
      categoryId,
      isAvailable: isAvailable !== undefined ? isAvailable : true, // 🔥 Lấy trạng thái từ form
      ingredients: ingredients || [], // 🔥 Lưu mảng nguyên liệu vào Database
    });

    res.status(201).json({
      message: "Menu created successfully",
      menu,
    });
  } catch (error) {
    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};



// ================= UPDATE MENU (ADMIN) =================
exports.updateMenu = async (req, res) => {
  try {

    const { id } = req.params;

    const menu = await Menu.findByIdAndUpdate(
      id,
      req.body,
      { new: true }
    );

    if (!menu) {
      return res.status(404).json({
        message: "Menu not found",
      });
    }

    res.status(200).json({
      message: "Menu updated successfully",
      menu,
    });

  } catch (error) {
    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};



// ================= DELETE MENU (ADMIN) =================
exports.deleteMenu = async (req, res) => {
  try {

    const { id } = req.params;

    const menu = await Menu.findByIdAndDelete(id);

    if (!menu) {
      return res.status(404).json({
        message: "Menu not found",
      });
    }

    res.status(200).json({
      message: "Menu deleted successfully",
    });

  } catch (error) {
    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};