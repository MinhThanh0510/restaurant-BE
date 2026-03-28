const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const User = require("../models/User");
const sendEmail = require("../utils/sendEmail");


// ================= REGISTER =================
exports.register = async (req, res) => {
  try {
    const { fullName, email, password, phone } = req.body;

    const existingEmail = await User.findOne({ email });
    if (existingEmail) {
      return res.status(400).json({
        message: "Email already exists",
      });
    }

    if (phone) {
      const existingPhone = await User.findOne({ phone });
      if (existingPhone) {
        return res.status(400).json({
          message: "Phone Number already exists",
        });
      }
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      fullName,
      email,
      password: hashedPassword,
      phone,
      role: "customer",
    });

    return res.status(201).json({
      message: "Register successfully",
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    return res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};

// ================= LOGIN (Đã tối ưu select password) =================
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Phải thêm .select("+password") vì trong Model mình đã ẩn nó đi để bảo mật
    const user = await User.findOne({ email }).select("+password");

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(400).json({ message: "Email or password is invalid" });
    }

    if (!user.isActive) {
      return res.status(403).json({ message: "Account is disabled" });
    }

    const accessToken = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_ACCESS_SECRET,
      { expiresIn: "1h" } // Tăng lên 1h cho đỡ bị logout liên tục khi test
    );

    const refreshToken = jwt.sign(
      { id: user._id },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: "7d" }
    );

    return res.status(200).json({
      message: "Login successfully",
      accessToken,
      refreshToken,
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ================= FORGOT PASSWORD =================
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: "There is no user with that email." });
    }

    // 1. Tạo Reset Token ngẫu nhiên
    const resetToken = crypto.randomBytes(20).toString("hex");

    // 2. Mã hóa Token lưu vào DB (để bảo mật) & Set hạn 15 phút
    user.resetPasswordToken = crypto.createHash("sha256").update(resetToken).digest("hex");
    user.resetPasswordExpire = Date.now() + 15 * 60 * 1000;
    await user.save();

    // 3. Tạo URL để gửi cho User (Trang Frontend mà user sẽ bấm vào)
    // Giả sử Frontend của bạn chạy ở cổng 5173
    const resetUrl = `${process.env.FRONTEND_URL || "http://localhost:5173"}/reset-password/${resetToken}`;

    // 4. Thiết kế giao diện Email
    const message = `
      <h2>Password Reset Request</h2>
      <p>Hello ${user.fullName},</p>
      <p>You are receiving this email because you (or someone else) has requested the reset of a password. Please make a PUT request to: \n\n <a href="${resetUrl}" target="_blank">Reset Password Link</a></p>
      <p>This link is valid for 15 minutes.</p>
      <p>If you did not request this, please ignore this email and your password will remain unchanged.</p>
    `;

    try {
      // 5. Gửi Mail
      await sendEmail({
        email: user.email,
        subject: "Restaurant System - Password Reset Token",
        html: message,
      });

      res.status(200).json({ message: "Email sent successfully!" });
    } catch (error) {
      // Nếu gửi mail lỗi, phải xóa token trong DB đi
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;
      await user.save();

      return res.status(500).json({ message: "Email could not be sent", error: error.message });
    }
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ================= RESET PASSWORD =================
exports.resetPassword = async (req, res) => {
  try {
    // 1. Lấy Token từ URL (params) và mã hóa lại để so khớp với DB
    const resetPasswordToken = crypto.createHash("sha256").update(req.params.token).digest("hex");

    // 2. Tìm User có Token này VÀ Token chưa hết hạn
    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ message: "Invalid or expired token" });
    }

    // 3. Đổi mật khẩu mới
    user.password = await bcrypt.hash(req.body.password, 10);

    // 4. Xóa Token cũ đi (Vì đã dùng xong)
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    res.status(200).json({ message: "Password has been reset successfully. You can now login." });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};