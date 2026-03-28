const nodemailer = require("nodemailer");

const sendEmail = async (options) => {
    const transporter = nodemailer.createTransport({
        host: "smtp.gmail.com",
        port: 587,
        secure: false, // false cho cổng 587
        auth: {
            user: process.env.EMAIL_USERNAME,
            pass: process.env.EMAIL_PASSWORD,
        },
        tls: {
            rejectUnauthorized: false // Bỏ qua kiểm tra chứng chỉ nếu chạy ở localhost
        }
    });

    const mailOptions = {
        from: `"Restaurant System" <${process.env.EMAIL_USERNAME}>`,
        to: options.email,
        subject: options.subject,
        html: options.html,
    };

    await transporter.sendMail(mailOptions);
};

module.exports = sendEmail;