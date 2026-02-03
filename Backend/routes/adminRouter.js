const express = require("express");
const { UserModel } = require("../models/userModel");
const { ProductModel } = require("../models/productModel");
const { OrderModel } = require("../models/orderModel");
const { authenticate } = require("../middlewares/authenticate");

const adminRouter = express.Router();

// Middleware to check if user is admin
const adminAuth = (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
        next();
    } else {
        res.status(403).json({ message: "Access denied. Admin only." });
    }
};

adminRouter.use(authenticate);
adminRouter.use(adminAuth);

// Get Dashboard Stats
adminRouter.get("/stats", async (req, res) => {
    try {
        const totalUsers = await UserModel.countDocuments({ role: { $ne: 'admin' } });
        const activeUsers = await UserModel.countDocuments({ role: { $ne: 'admin' } }); // For now same as total, unless we have active status
        const totalProducts = await ProductModel.countDocuments();
        const totalOrders = await OrderModel.countDocuments();

        const revenueResult = await OrderModel.aggregate([
            { $group: { _id: null, total: { $sum: "$totalAmount" } } }
        ]);
        const totalRevenue = revenueResult.length > 0 ? revenueResult[0].total : 0;

        res.status(200).json({
            totalUsers,
            activeUsers,
            totalProducts,
            totalOrders,
            totalRevenue
        });
    } catch (error) {
        res.status(500).json({ message: "Error fetching stats", error: error.message });
    }
});

// Get All Users
adminRouter.get("/users", async (req, res) => {
    try {
        const users = await UserModel.find({ role: { $ne: 'admin' } }).select("-password -otp -otpExpiry -resetOtp -resetOtpExpiry");
        res.status(200).json(users);
    } catch (error) {
        res.status(500).json({ message: "Error fetching users", error: error.message });
    }
});

// Get All Orders
adminRouter.get("/orders", async (req, res) => {
    try {
        const orders = await OrderModel.find()
            .populate("consumerId", "name email")
            .populate("farmerId", "name email farmInfo.farmName")
            .sort({ createdAt: -1 });
        res.status(200).json(orders);
    } catch (error) {
        res.status(500).json({ message: "Error fetching orders", error: error.message });
    }
});

module.exports = { adminRouter };
