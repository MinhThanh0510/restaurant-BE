const Reservation = require("../models/Reservation");
const Inventory = require("../models/Inventory");
const Review = require("../models/Review");

// 🔥 Hàm hỗ trợ ép kiểu ngày an toàn (bỏ qua lệch múi giờ)
const toYYYYMMDD = (dateInput) => {
  const d = new Date(dateInput);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

exports.getDashboardStats = async (req, res) => {
  try {
    const now = new Date();
    const todayStr = toYYYYMMDD(now); // Lấy chuỗi ngày hôm nay (VD: "2026-03-25")
    
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek = new Date(today);
    const day = startOfWeek.getDay() || 7; 
    if (day !== 1) startOfWeek.setHours(-24 * (day - 1));
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfYear = new Date(now.getFullYear(), 0, 1);

    // 1. TÍNH TOÁN DOANH THU
    const completedReservations = await Reservation.find({ status: "completed" });
    
    let dailyRev = 0, weeklyRev = 0, monthlyRev = 0, yearlyRev = 0;

    completedReservations.forEach(r => {
      const rDate = new Date(r.reservationDate);
      const amount = r.totalAmount || 0;
      
      // So sánh trực tiếp chuỗi YYYY-MM-DD để tránh lệch múi giờ
      if (toYYYYMMDD(rDate) === todayStr) dailyRev += amount;
      if (rDate >= startOfWeek) weeklyRev += amount;
      if (rDate >= startOfMonth) monthlyRev += amount;
      if (rDate >= startOfYear) yearlyRev += amount;
    });

    // 2. DỮ LIỆU BIỂU ĐỒ (7 Ngày gần nhất)
    const chartData = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const targetStr = toYYYYMMDD(d); // Chuỗi ngày mục tiêu
      const displayDate = d.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit' });
      
      const dailyTotal = completedReservations.reduce((sum, r) => {
        // Khớp tuyệt đối chuỗi ngày
        if (toYYYYMMDD(r.reservationDate) === targetStr) {
          return sum + (r.totalAmount || 0);
        }
        return sum;
      }, 0);

      chartData.push({
        date: displayDate,
        revenue: dailyTotal
      });
    }

    // 3. LỊCH TRÌNH 7 NGÀY TỚI
    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);
    
    const upcomingBookings = await Reservation.find({
      reservationDate: { $gte: today, $lt: nextWeek },
      status: { $in: ["pending", "confirmed"] }
    }).populate("tableId", "tableNumber").sort({ reservationDate: 1, startTime: 1 });

    // 4. KHO HÀNG & ĐÁNH GIÁ
    const lowStockItems = await Inventory.find({ quantity: { $lt: 100 } }).sort({ quantity: 1 }).limit(5);
    
    const reviews = await Review.find({ isHidden: false });
    const avgRating = reviews.length > 0 
      ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1) 
      : 0;

    // TRẢ VỀ DỮ LIỆU
    res.status(200).json({
      revenue: { daily: dailyRev, weekly: weeklyRev, monthly: monthlyRev, yearly: yearlyRev },
      chartData,
      stats: {
        // 🔥 Đếm chính xác số Booking của riêng ngày hôm nay
        todayBookingsCount: upcomingBookings.filter(b => toYYYYMMDD(b.reservationDate) === todayStr).length,
        lowStockCount: lowStockItems.length,
        avgRating: avgRating,
        totalReviews: reviews.length
      },
      upcomingBookings,
      lowStockItems
    });

  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};