const farmerAuth = (req, res, next) => {
  try {
    // Check if user is authenticated and is a farmer
    if (!req.user || req.user.role !== "farmer") {
      return res.status(403).json({
        message: "Access denied. Only farmers can perform this action.",
      });
    }
    next();
  } catch (error) {
    res.status(500).json({
      message: "Error in farmer authentication",
      error: error.message,
    });
  }
};

module.exports = { farmerAuth };
