// Product Management Functions
document.addEventListener("DOMContentLoaded", function () {
  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user"));
  const BACKEND_URL = "http://localhost:3000";

  // Check authentication
  if (!token) {
    window.location.href = "login.html";
    return;
  }

  // Show Add Product button only for farmers
  const addProductBtn = document.getElementById("addProductBtn");
  if (addProductBtn && user && user.role === "farmer") {
    addProductBtn.style.display = "inline-block";
    addProductBtn.addEventListener("click", showAddProductModal);
  }

  // Load products
  async function loadProducts() {
    try {
      const response = await fetch(`${BACKEND_URL}/products`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to load products");
      }

      const products = await response.json();
      displayProducts(products);
    } catch (error) {
      console.error("Error loading products:", error);
      alert("Failed to load products");
    }
  }

  // Display products in the UI
  function displayProducts(products) {
    const productsContainer = document.getElementById("productsContainer");
    if (!productsContainer) return;

    productsContainer.innerHTML = products
      .map(
        (product) => `
            <div class="col-md-4 mb-4">
                <div class="card h-100">
                    <img src="${
                      product.imageUrl || "images/default-product.jpg"
                    }" class="card-img-top" alt="${product.name}">
                    <div class="card-body">
                        <h5 class="card-title">${product.name}</h5>
                        <p class="card-text">${product.description}</p>
                        <p class="card-text"><strong>Price:</strong> ₹${
                          product.price
                        }</p>
                        <p class="card-text"><small class="text-muted">Available: ${
                          product.quantity
                        } ${product.unit}</small></p>
                        ${
                          user.role === "consumer"
                            ? `
                            <button class="btn btn-primary" onclick="addToCart('${product._id}')">
                                Add to Cart
                            </button>
                        `
                            : ""
                        }
                    </div>
                </div>
            </div>
        `
      )
      .join("");
  }

  // Add to cart functionality
  window.addToCart = async function (productId) {
    try {
      const response = await fetch(`${BACKEND_URL}/orders/cart`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ productId, quantity: 1 }),
      });

      if (!response.ok) {
        throw new Error("Failed to add to cart");
      }

      alert("Product added to cart successfully!");
    } catch (error) {
      console.error("Error adding to cart:", error);
      alert("Failed to add product to cart");
    }
  };

  // Show Add Product Modal
  function showAddProductModal() {
    const modalElement = document.getElementById("addProductModal");
    if (!modalElement) {
      console.error("Add Product Modal not found");
      return;
    }
    const modal = new bootstrap.Modal(modalElement);
    document.getElementById("addProductForm").reset();
    modal.show();
  }

  // Submit Product Form
  window.submitProduct = async function () {
    const form = document.getElementById("addProductForm");
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    const name = document.getElementById("productName").value.trim();
    const description = document.getElementById("productDescription").value.trim();
    const price = parseFloat(document.getElementById("productPrice").value);
    const quantity = parseInt(document.getElementById("productQuantity").value);
    const unit = document.getElementById("productUnit").value;
    const category = document.getElementById("productCategory").value;
    const imageFile = document.getElementById("productImage").files[0];

    // Validate required fields
    if (!name || !description || !category || !unit) {
      alert("Please fill in all required fields");
      return;
    }

    if (isNaN(price) || price <= 0) {
      alert("Please enter a valid price");
      return;
    }

    if (isNaN(quantity) || quantity < 0) {
      alert("Please enter a valid quantity");
      return;
    }

    // Prepare product data
    const productData = {
      name,
      description,
      price,
      quantity,
      unit,
      category,
      images: [], // For now, we'll handle images later if needed
    };

    try {
      const submitBtn = document.querySelector('#addProductModal .btn-success');
      const originalText = submitBtn.innerHTML;
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Adding...';

      const response = await fetch(`${BACKEND_URL}/products`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(productData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to add product");
      }

      // Close modal
      const modalElement = document.getElementById("addProductModal");
      const modal = bootstrap.Modal.getInstance(modalElement);
      if (modal) {
        modal.hide();
      }

      // Reset form
      form.reset();

      // Reload products
      await loadProducts();

      alert("Product added successfully!");
    } catch (error) {
      console.error("Error adding product:", error);
      alert(error.message || "Failed to add product. Please try again.");
    } finally {
      const submitBtn = document.querySelector('#addProductModal .btn-success');
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = "Add Product";
      }
    }
  };

  // Logout function
  window.logout = function () {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "login.html";
  };

  loadProducts();
});
