const mongoose = require("mongoose");

const tokenSchema = new mongoose.Schema({
  email: String,
  token: String,
  refresh_token: String,
  createdAt: { type: Date, default: Date.now, expires: 2592000 },
});

const TokenModel = mongoose.model("Token", tokenSchema);
module.exports = { TokenModel };
