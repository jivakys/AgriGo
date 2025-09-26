const express = require("express");
require("dotenv").config();
const { UserModel } = require("../models/userModel");
const { TokenModel } = require("../models/tokenModel");
const crypto = require("crypto");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { sendEmail } = require("../utils/sendmail");
const userRouter = express.Router();

userRouter.post("/register", async (req, res) => {
  const { name, email, password, phone, role, farmInfo } = req.body;

  try {
    const existingUser = await UserModel.findOne({ email });

    if (existingUser) {
      return res.status(400).send({ error: "User already registered" });
    }

    const hashedPassword = await bcrypt.hash(password, +process.env.SALT);

    const newUser = new UserModel({
      name,
      email,
      password: hashedPassword,
      phone,
      role,
      farmInfo,
    });

    await newUser.save();

    return res.status(200).send({
      message: "User Registered Successfully",
      user: {
        userID: newUser._id,
        name: newUser.name,
        role: newUser.role,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).send({ error: "Server error", message: error.message });
  }
});

userRouter.post("/login-password", async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await UserModel.findOne({ email });
    if (!user) {
      return res.status(400).send({
        error: "User not found, please register",
        OK: false,
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).send({
        error: "Incorrect password",
        OK: false,
      });
    }

    const accessToken = jwt.sign(
      { userID: user._id, role: user.role, name: user.name },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    const refreshToken = jwt.sign(
      { userID: user._id, role: user.role, name: user.name },
      process.env.REFRESH_SECRETKEY,
      { expiresIn: "30d" }
    );

    await TokenModel.findOneAndUpdate(
      { userId: user._id },
      { accessToken, refreshToken },
      { upsert: true }
    );

    return res.status(200).send({
      message: "Login successful",
      token: accessToken,
      refresh_token: refreshToken,
      user: {
        userID: user._id,
        name: user.name,
        role: user.role,
      },
      OK: true,
    });
  } catch (error) {
    res.status(500).send({ message: "Internal error", error: error.message });
  }
});

userRouter.post("/login-otp", async (req, res) => {
  const { email } = req.body;

  try {
    const user = await UserModel.findOne({ email });
    if (!user) {
      return res.status(400).send({
        error: "User not found, please register",
        OK: false,
      });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const hashedOtp = await bcrypt.hash(otp, 10);

    user.otp = hashedOtp;
    user.otpExpiry = Date.now() + 5 * 60 * 1000;
    await user.save();

    await sendEmail(user.email, "Your AgriGo Login OTP", otp, "login");

    res.json({ message: "OTP sent to email" });
  } catch (error) {
    res.status(500).send({ message: "Internal error", error: error.message });
  }
});

userRouter.post("/verify-otp", async (req, res) => {
  const { email, otp } = req.body;

  const user = await UserModel.findOne({ email });
  if (!user) return res.status(400).json({ error: "User not found" });

  if (Date.now() > user.otpExpiry)
    return res.status(400).json({ error: "OTP expired" });

  const isMatch = await bcrypt.compare(otp, user.otp);
  if (!isMatch) return res.status(400).json({ error: "Invalid OTP" });

  const accessToken = jwt.sign(
    { userID: user._id, role: user.role, name: user.name },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );

  const refreshToken = jwt.sign(
    { userID: user._id, role: user.role, name: user.name },
    process.env.REFRESH_SECRETKEY,
    { expiresIn: "30d" }
  );

  await TokenModel.findOneAndUpdate(
    { userId: user._id },
    { accessToken, refreshToken },
    { upsert: true }
  );

  user.otp = undefined;
  user.otpExpiry = undefined;

  return res.status(200).send({
    message: "Login successful",
    token: accessToken,
    refresh_token: refreshToken,
    user: {
      userID: user._id,
      name: user.name,
      role: user.role,
    },
    OK: true,
  });
});

userRouter.post("/logout", async (req, res) => {
  try {
    const token = req.headers.authorization;
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    await TokenModel.deleteOne({ userId: decoded.userID });

    res.status(200).send({ message: "Logged out successfully" });
  } catch (error) {
    res.status(500).send({
      message: "Logout failed",
      error: error.message,
    });
  }
});

userRouter.post("/forget-password", async (req, res) => {
  const { email } = req.body;
  const user = await UserModel.findOne({ email });
  if (!user) {
    return res.status(400).send({
      error: "User not found, please register",
      OK: false,
    });
  }
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const hashedOtp = await bcrypt.hash(otp, 10);

  user.resetOtp = hashedOtp;
  user.resetOtpExpiry = Date.now() + 10 * 60 * 1000;
  await user.save();

  await sendEmail(
    user.email,
    "AgriGo Password Reset OTP",
    otp,
    "forgotPassword"
  );

  res.json({ message: "OTP sent to email" });
});

userRouter.post("/reset-password", async (req, res) => {
  const { email, otp, newPassword } = req.body;

  const user = await UserModel.findOne({ email });
  if (!user) {
    return res.status(400).send({
      error: "User not found, please register",
      OK: false,
    });
  }

  if (Date.now() > user.resetOtpExpiry) {
    return res.status(400).json({ error: "OTP expired" });
  }

  const isMatch = await bcrypt.compare(otp, user.resetOtp);
  if (!isMatch) {
    return res.status(400).json({ error: "Invalid OTP" });
  }

  user.password = await bcrypt.hash(newPassword, 10);

  user.resetOtp = undefined;
  user.resetOtpExpiry = undefined;
  await user.save();

  res.json({ message: "Password reset successful" });
});

// Verify reset OTP without changing password
userRouter.post("/verify-reset-otp", async (req, res) => {
  const { email, otp } = req.body;

  try {
    const user = await UserModel.findOne({ email });
    if (!user) {
      return res.status(400).send({
        error: "User not found, please register",
        OK: false,
      });
    }

    if (!user.resetOtp || !user.resetOtpExpiry) {
      return res.status(400).json({ error: "No active OTP. Please request again." });
    }

    if (Date.now() > user.resetOtpExpiry) {
      return res.status(400).json({ error: "OTP expired" });
    }

    const isMatch = await bcrypt.compare(otp, user.resetOtp);
    if (!isMatch) {
      return res.status(400).json({ error: "Invalid OTP" });
    }

    return res.status(200).json({ message: "OTP verified", OK: true });
  } catch (error) {
    return res.status(500).json({ error: "Internal error", message: error.message });
  }
});

module.exports = { userRouter };
