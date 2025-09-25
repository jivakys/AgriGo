const nodemailer = require("nodemailer");
require("dotenv").config();

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.NODEMAILER_EMAIL_USER,
    pass: process.env.NODEMAILER_EMAIL_PASSWORD,
  },
});

/**
 * Send OTP Email (for login or password reset)
 * @param {string} to - Receiver email
 * @param {string} subject - Email subject
 * @param {string} otp - One-time password
 * @param {string} type - "login" | "forgotPassword"
 */
const sendEmail = async (to, subject, otp, type = "login") => {
  let htmlContent;

  if (type === "login") {
    // 🔑 Login OTP Email
    htmlContent = `
      <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: auto; border: 1px solid #eee; border-radius: 10px; background: #f9f9f9;">
        <h2 style="color: #4CAF50; text-align: center;">🔐 Secure Login Verification</h2>
        <p style="font-size: 16px; color: #333;">
          Hello,
        </p>
        <p style="font-size: 16px; color: #333;">
          You requested to log in using your email. Please use the following One-Time Password (OTP):
        </p>
        <div style="text-align: center; margin: 20px 0;">
          <span style="font-size: 24px; font-weight: bold; color: #086c0bde; letter-spacing: 3px;">${otp}</span>
        </div>
        <p style="font-size: 14px; color: #555;">
          This OTP will expire in <strong>5 minutes</strong>. Please do not share it with anyone.
        </p>
        <p style="font-size: 14px; color: #777; text-align: center; margin-top: 30px;"> 
          If you did not request this, you can safely ignore this email.
        </p>
        <hr style="margin: 20px 0; border: none; border-top: 1px solid #ddd;">
        <p style="font-size: 12px; color: #aaa; text-align: center;">
          © ${new Date().getFullYear()} AgriGo. All rights reserved.
        </p>
      </div>
    `;
  } else if (type === "forgotPassword") {
    // 🔄 Forgot Password OTP Email (with AgriGo Logo)
    htmlContent = `
      <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: auto; border: 1px solid #ddd; border-radius: 10px; background: #ffffff;">
        <div style="text-align: center; margin-bottom: 20px;">
          <h2 style="color: #2e7d32; font-size: 28px; margin: 0;">
            <i class="fas fa-leaf" style="color:#4CAF50; margin-right:8px;"></i>AgriGo
          </h2>
        </div>
        <h3 style="color: #333; text-align: center;">Reset Your Password</h3>
        <p style="font-size: 16px; color: #444; text-align: center;">
          We received a request to reset your password. Use the OTP below to proceed:
        </p>
        <div style="text-align: center; margin: 20px 0;">
          <span style="display:inline-block; background:#4CAF50; color:#fff; font-size:24px; font-weight:bold; padding:12px 24px; border-radius:8px; letter-spacing:3px;">
            ${otp}
          </span>
        </div>
        <p style="font-size: 14px; color: #555; text-align: center;">
          This OTP is valid for <strong>10 minutes</strong>. Enter it in the app to reset your password.
        </p>
        <p style="font-size: 14px; color: #777; text-align: center; margin-top: 30px;"> 
          If you did not request a password reset, please ignore this email.
        </p>
        <hr style="margin: 20px 0; border: none; border-top: 1px solid #eee;">
        <p style="font-size: 12px; color: #aaa; text-align: center;">
          © ${new Date().getFullYear()} AgriGo. All rights reserved.
        </p>
      </div>
    `;
  }

  await transporter.sendMail({
    from: `"AgriGo" <${process.env.NODEMAILER_EMAIL_USER}>`,
    to,
    subject,
    html: htmlContent,
  });
};

module.exports = { sendEmail };
