const mongoose = require("mongoose");
const userSchema = mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true },
    password: { type: String },
    otp: { type: String },
    otpExpiry: { type: Date },
    phone: { type: String, required: true },
    role: { type: String, enum: ["farmer", "consumer"], default: "consumer" },
    farmInfo: {
      farmName: String,
      products: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
        },
      ],
    },
    resetPasswordToken: { type: String },
    resetPasswordExpiry: { type: Date },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    versionKey: false,
  }
);

const UserModel = mongoose.model("user", userSchema);

module.exports = { UserModel };
