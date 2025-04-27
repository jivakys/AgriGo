const express = require("express");
const { ProductModel } = require("../models/productModel");
const { farmerAuth } = require("../middlewares/farmerAuth");

const productRouter = express.Router();

// Get all products
productRouter.get("/", async (req, res) => {
  try {
    const products = await ProductModel.find().populate(
      "farmerId",
      "name email phone farmInfo.farmName"
    );
    res.status(200).json(products);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching products", error: error.message });
  }
});

// Get single product
productRouter.get("/:id", async (req, res) => {
  try {
    const product = await ProductModel.findById(req.params.id).populate(
      "farmerId",
      "name email phone farmInfo.farmName"
    );

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.status(200).json(product);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching product", error: error.message });
  }
});

// Create a new product (farmer only)
productRouter.post("/", farmerAuth, async (req, res) => {
  try {
    // console.log("Request body:", req.body);
    // console.log("Request headers:", req.headers);
    // console.log("User from token:", req.user);

    if (!req.body) {
      return res.status(400).json({ message: "Request body is missing" });
    }

    const { name, description, price, quantity, unit, category, images } =
      req.body;
    const farmerId = req.user.userID;

    // Validate required fields
    if (!name || !description || !price || !quantity || !unit || !category) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const product = new ProductModel({
      name,
      description,
      price,
      quantity,
      unit,
      category,
      images: images || [],
      farmerId,
    });

    await product.save();
    res.status(201).json({ message: "Product created successfully", product });
  } catch (error) {
    console.error("Product creation error:", error);
    res
      .status(500)
      .json({ message: "Error creating product", error: error.message });
  }
});

// Get farmer's products (farmer only)
productRouter.get("/farmer/products", farmerAuth, async (req, res) => {
  try {
    const farmerId = req.user._id;
    const products = await ProductModel.find({ farmerId });
    res.status(200).json(products);
  } catch (error) {
    res.status(500).json({
      message: "Error fetching farmer products",
      error: error.message,
    });
  }
});

// Update product (farmer only)
productRouter.put("/:id", farmerAuth, async (req, res) => {
  try {
    const {
      name,
      description,
      price,
      quantity,
      unit,
      category,
      images,
      isAvailable,
    } = req.body;
    const productId = req.params.id;
    const farmerId = req.user.userID;

    console.log("Update request details:", {
      productId,
      farmerId,
      requestBody: req.body,
    });

    // First check if the product exists
    const existingProduct = await ProductModel.findById(productId);
    if (!existingProduct) {
      return res.status(404).json({ message: "Product not found" });
    }

    // Then check if it belongs to the farmer
    if (existingProduct.farmerId.toString() !== farmerId) {
      return res.status(403).json({
        message: "Unauthorized: Product does not belong to this farmer",
        productFarmerId: existingProduct.farmerId,
        requestingFarmerId: farmerId,
      });
    }

    const updatedProduct = await ProductModel.findByIdAndUpdate(
      productId,
      {
        name,
        description,
        price,
        quantity,
        unit,
        category,
        images: images || existingProduct.images,
        isAvailable,
      },
      { new: true }
    );

    res.status(200).json({
      message: "Product updated successfully",
      product: updatedProduct,
    });
  } catch (error) {
    console.error("Product update error:", error);
    res.status(500).json({
      message: "Error updating product",
      error: error.message,
    });
  }
});

// Delete product (farmer only)
productRouter.delete("/:id", farmerAuth, async (req, res) => {
  try {
    const productId = req.params.id;
    const farmerId = req.user.userID;

    console.log("Delete request details:", {
      productId,
      farmerId,
    });

    // First check if the product exists
    const existingProduct = await ProductModel.findById(productId);
    if (!existingProduct) {
      return res.status(404).json({ message: "Product not found" });
    }

    // Then check if it belongs to the farmer
    if (existingProduct.farmerId.toString() !== farmerId) {
      return res.status(403).json({
        message: "Unauthorized: Product does not belong to this farmer",
        productFarmerId: existingProduct.farmerId,
        requestingFarmerId: farmerId,
      });
    }

    await ProductModel.findByIdAndDelete(productId);
    res.status(200).json({
      message: "Product deleted successfully",
      deletedProduct: existingProduct,
    });
  } catch (error) {
    console.error("Product deletion error:", error);
    res.status(500).json({
      message: "Error deleting product",
      error: error.message,
    });
  }
});

module.exports = { productRouter };
