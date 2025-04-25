const express = require("express");
const { connection } = require("./config/db");
const { userRouter } = require("./routes/userRouter");
const { productRouter } = require("./routes/productRouter");
const { orderRouter } = require("./routes/orderRouter");
const app = express();
require("dotenv").config();

app.use(express.json());

// Basic test route
app.get("/", (req, res) => {
  res.send("Welcome to agriGo.");
});

app.use("/auth/user", userRouter);
app.use("/products", productRouter);
app.use("/order", orderRouter);

// Start server
app.listen(process.env.PORT, async () => {
  try {
    await connection;
    console.log("Connected to the Database");
  } catch (error) {
    console.error("Database connection failed:", error.message);
  }
  console.log(`Server is running on port ${process.env.PORT}`);
});
