const mongoose = require("mongoose");

const menuCategorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    description: {
      type: String,
    },
  },
  {
    timestamps: true,
    collection: "MenuCategory",
  }
);

module.exports = mongoose.model("MenuCategory", menuCategorySchema);