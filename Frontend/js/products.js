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

  // Show Add Product button only for farmers, hide Cart for them
  const addProductBtn = document.getElementById("addProductBtn");
  const topCartBtn = document.getElementById("topCartBtn");

  if (user && user.role === "farmer") {
    if (addProductBtn) {
      addProductBtn.style.display = "inline-block";
      addProductBtn.addEventListener("click", showAddProductModal);
    }
    if (topCartBtn) {
      topCartBtn.style.display = "none";
    }
  }

  let allProducts = [];

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

      allProducts = await response.json();
      applyFilters(); // Display products with current filters (if any)
    } catch (error) {
      console.error("Error loading products:", error);
      alert("Failed to load products");
    }
  }

  // Filter and Sort Event Listeners
  const searchInput = document.getElementById("searchInput");
  const categoryFilter = document.getElementById("categoryFilter");
  const sortFilter = document.getElementById("sortFilter");

  if (searchInput) searchInput.addEventListener("input", applyFilters);
  if (categoryFilter) categoryFilter.addEventListener("change", applyFilters);
  if (sortFilter) sortFilter.addEventListener("change", applyFilters);

  function applyFilters() {
    let filtered = [...allProducts];

    // Search
    const searchTerm = searchInput ? searchInput.value.toLowerCase() : "";
    if (searchTerm) {
      filtered = filtered.filter(
        (p) =>
          p.name.toLowerCase().includes(searchTerm) ||
          p.description.toLowerCase().includes(searchTerm)
      );
    }

    // Category
    const category = categoryFilter ? categoryFilter.value : "";
    if (category) {
      filtered = filtered.filter((p) => p.category === category);
    }

    // Sort
    const sortValue = sortFilter ? sortFilter.value : "";
    if (sortValue) {
      filtered.sort((a, b) => {
        switch (sortValue) {
          case "price_asc":
            return a.price - b.price;
          case "price_desc":
            return b.price - a.price;
          case "name_asc":
            return a.name.localeCompare(b.name);
          case "name_desc":
            return b.name.localeCompare(a.name);
          default:
            return 0;
        }
      });
    }

    displayProducts(filtered);
  }

  function displayProducts(products) {
    const productsContainer = document.getElementById("productsContainer");
    if (!productsContainer) return;

    productsContainer.innerHTML = products
      .map(
        (product) => `
            <div class="col-md-4 mb-4">
                <div class="card h-100 product-card shadow-sm border-0 rounded-4 overflow-hidden">
                    <div class="position-relative">
                        <img src="${(product.images && product.images[0]) ||
          product.imageUrl ||
          "https://placehold.co/600x400?text=No+Image"
          }" class="card-img-top" alt="${product.name}" style="height: 250px; object-fit: cover;">
                        ${product.quantity === 0 ? '<span class="position-absolute top-0 end-0 badge bg-danger m-3">Out of Stock</span>' : ''}
                    </div>
                    <div class="card-body d-flex flex-column p-4">
                        <div class="d-flex justify-content-between align-items-start mb-2">
                            <div>
                                <h5 class="card-title fw-bold mb-1 fs-4">${product.name}</h5>
                                <p class="text-muted small mb-0"><i class="fas fa-store me-1"></i>${product.farmerName || "AgriGo Farmer"}</p>
                            </div>
                            <h4 class="text-success fw-bold mb-0">₹${product.price}</h4>
                        </div>
                        
                        <p class="card-text text-secondary mb-4 flex-grow-1" style="display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">
                            ${product.description}
                        </p>
                        
                        <div class="mt-auto d-grid gap-2">
                             <a href="product-details.html?id=${product._id}" class="btn btn-outline-secondary rounded-pill">
                                Show Details
                            </a>
                            ${user.role === "consumer" && product.quantity > 0
            ? `
                                <button class="btn btn-order-now text-white fw-bold rounded-pill py-2" onclick="addToCart('${product._id}')">
                                    <i class="fas fa-shopping-bag me-2"></i>Order Now
                                </button>
                            `
            : ""
          }
                        </div>
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
    const description = document
      .getElementById("productDescription")
      .value.trim();
    const price = parseFloat(document.getElementById("productPrice").value);
    const quantity = parseInt(document.getElementById("productQuantity").value);
    const unit = document.getElementById("productUnit").value;
    const category = document.getElementById("productCategory").value;
    const imageUrl = document.getElementById("productImage").value.trim();

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
      images: imageUrl ? [imageUrl] : [],
    };

    try {
      const submitBtn = document.querySelector("#addProductModal .btn-success");
      const originalText = submitBtn.innerHTML;
      submitBtn.disabled = true;
      submitBtn.innerHTML =
        '<i class="fas fa-spinner fa-spin me-2"></i>Adding...';

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
      const submitBtn = document.querySelector("#addProductModal .btn-success");
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
