const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {

    resetPasswordToken: String,
    resetPasswordExpire: Date,
    
    fullName: {
      type: String,
      required: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
    },

    password: {
      type: String,
      required: true,
    },

    phone: {
      type: String,
    },

    role: {
      type: String,
      enum: ["customer", "admin", "staff"],
      default: "customer",
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);