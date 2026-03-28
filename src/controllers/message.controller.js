const Message = require("../models/Message");
const User = require("../models/User");

// 1. Lấy lịch sử chat giữa 2 người
exports.getChatHistory = async (req, res) => {
    try {
        const { partnerId } = req.params; // ID của người đang chat cùng
        const myId = req.user.id;

        const history = await Message.find({
            $or: [
                { senderId: myId, receiverId: partnerId },
                { senderId: partnerId, receiverId: myId },
            ],
        }).sort({ createdAt: 1 }); // Sắp xếp từ cũ đến mới

        res.status(200).json(history);
    } catch (error) {
        res.status(500).json({ message: "Error fetching history", error: error.message });
    }
};

// 2. Lấy danh sách khách hàng đã nhắn tin (Dành cho Admin)
exports.getConversations = async (req, res) => {
    try {
        const adminId = req.user.id;

        // Tìm tất cả tin nhắn liên quan đến Admin
        const messages = await Message.find({
            $or: [{ senderId: adminId }, { receiverId: adminId }],
        }).sort({ createdAt: -1 });

        // Lọc ra danh sách User ID duy nhất
        const userIds = [...new Set(messages.map(m =>
            m.senderId.toString() === adminId ? m.receiverId.toString() : m.senderId.toString()
        ))];

        // Lấy thông tin chi tiết của các User đó
        const users = await User.find({ _id: { $in: userIds } }).select("fullName email");

        // Kết hợp thêm tin nhắn cuối cùng để hiển thị ở Sidebar
        const conversations = users.map(u => {
            const lastMsg = messages.find(m =>
                m.senderId.toString() === u._id.toString() || m.receiverId.toString() === u._id.toString()
            );
            return {
                _id: u._id,
                fullName: u.fullName,
                lastMessage: lastMsg ? lastMsg.message : "",
                lastTime: lastMsg ? lastMsg.createdAt : null
            };
        });

        res.status(200).json(conversations);
    } catch (error) {
        res.status(500).json({ message: "Error fetching conversations", error: error.message });
    }
};