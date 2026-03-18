const mongoose = require("mongoose");
const dns = require("dns");

const connectDB = async () => {
  try {
    console.log("========================================");
    console.log("🔍 Connecting to MongoDB...");
    console.log("MONGO_URI =", process.env.MONGO_URI);
    console.log("========================================");

    // Bật debug mongoose
    mongoose.set("debug", true);

    // Thử set DNS server Google nếu cần
     dns.setServers(["8.8.8.8", "8.8.4.4"]);

    // Kết nối MongoDB
    
    await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 5000, // timeout 5s
      socketTimeoutMS: 45000,
    });

    console.log("========================================");
    console.log("✅ MongoDB Connected Successfully");
    console.log("Database:", mongoose.connection.name);
    console.log("Host:", mongoose.connection.host);
    console.log("========================================");
  } catch (error) {
    console.error("========================================");
    console.error("❌ MongoDB Connection Failed");
    console.error("========================================");

    console.error("Name:", error.name);
    console.error("Code:", error.code);
    console.error("Message:", error.message);
    console.error("Stack:", error.stack);

    if (error.reason) console.error("Reason:", error.reason);
    if (error.cause) console.error("Cause:", error.cause);

    console.error("========================================");

    // 🔥 Phân loại lỗi chi tiết
    switch (error.name) {
      case "MongoNetworkError":
        console.error("👉 Network Error (DNS / Firewall / Internet issue)");
        break;
      case "MongoServerSelectionError":
        console.error("👉 Cannot select MongoDB server (Atlas blocked / DNS SRV failed)");
        break;
      case "MongoParseError":
        console.error("👉 Invalid MongoDB connection string format");
        break;
      case "MongoTimeoutError":
        console.error("👉 Connection timeout (Network slow or blocked)");
        break;
      case "MongoServerError":
        console.error("👉 MongoDB server error");
        break;
      default:
        console.error("👉 Unknown MongoDB error");
    }

    if (error.message.includes("querySrv")) {
      console.error("👉 DNS SRV record bị chặn (mongodb+srv không resolve được)");
    }

    if (error.message.includes("authentication failed")) {
      console.error("👉 Sai username hoặc password");
    }

    if (error.message.includes("ENOTFOUND")) {
      console.error("👉 Sai hostname hoặc DNS không resolve được");
    }

    console.error("========================================");
    process.exit(1);
  }
};

module.exports = connectDB;