document.addEventListener("DOMContentLoaded", function () {
  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user"));
  const BACKEND_URL = "http://localhost:3000";
  const urlParams = new URLSearchParams(window.location.search);
  const productId = urlParams.get("id");

  if (!token) {
    window.location.href = "login.html";
    return;
  }

  if (!productId) {
    alert("Product not found");
    window.location.href = "products.html";
    return;
  }

  loadProductDetails();

  async function loadProductDetails() {
    try {
      const response = await fetch(`${BACKEND_URL}/products/${productId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to load product details");
      }

      const product = await response.json();
      displayProductDetails(product);
    } catch (error) {
      console.error("Error loading product details:", error);
      document.getElementById(
        "productDetailsContainer"
      ).innerHTML = `<div class="col-12 text-center text-danger"><h3>Error loading product details</h3><p>${error.message}</p></div>`;
    }
  }

  function displayProductDetails(product) {
    const container = document.getElementById("productDetailsContainer");
    const isOwner =
      user &&
      user.role === "farmer" &&
      (product.farmer === user._id || product.farmer._id === user._id);

    const imageUrl =
      (product.images && product.images[0]) ||
      product.imageUrl ||
      "https://placehold.co/600x400?text=No+Image";

    let controlsHtml = "";
    if (isOwner) {
      controlsHtml = `
                <div class="d-flex gap-2 mt-4">
                    <button class="btn btn-warning flex-grow-1" onclick="openEditModal()">
                        <i class="fas fa-edit me-2"></i> Edit Product
                    </button>
                    <button class="btn btn-danger flex-grow-1" onclick="deleteProduct('${product._id}')">
                        <i class="fas fa-trash me-2"></i> Delete Product
                    </button>
                </div>
            `;
    } else if (user.role === "consumer") {
      controlsHtml = `
                <div class="row align-items-center mt-4 g-3">
                    <div class="col-auto">
                        <div class="quantity-selector">
                            <button class="btn btn-sm btn-link text-dark text-decoration-none" onclick="this.nextElementSibling.stepDown()">
                                <i class="fas fa-minus"></i>
                            </button>
                            <input type="number" id="purchaseQuantity" value="1" min="1" max="${product.quantity}" class="form-control border-0 text-center p-0" style="width: 40px;">
                            <button class="btn btn-sm btn-link text-dark text-decoration-none" onclick="this.previousElementSibling.stepUp()">
                                <i class="fas fa-plus"></i>
                            </button>
                        </div>
                    </div>
                    <div class="col">
                         <div class="d-flex gap-2">
                             <button class="btn btn-success flex-grow-1 py-2 fw-bold" onclick="addToCart('${product._id}', document.getElementById('purchaseQuantity').value)">
                                ADD TO CART - ₹${product.price}
                            </button>
                             <button class="btn btn-gpay flex-grow-1 py-2 rounded-3">
                                Buy with <span class="fw-bold ms-1">G</span>Pay
                            </button>
                         </div>
                    </div>
                </div>
            `;
    }

    container.innerHTML = `
            <div class="col-lg-6 mb-4 mb-lg-0">
                <div class="product-detail-image-container">
                    <img src="${imageUrl}" class="product-detail-image" alt="${product.name
      }">
                </div>
            </div>
            
            <div class="col-lg-6 ps-lg-5">
                <h1 class="display-5 fw-bold mb-3">${product.name}</h1>
                
                <p class="lead text-secondary mb-4">
                    Experience the freshness of nature with <strong>${product.name
      }</strong>, sourced directly from 
                    <strong>${product.farmerName || "our trusted local farmers"
      }</strong>. 
                    ${product.description}
                </p>

                <div class="d-flex align-items-center mb-4">
                    <div class="text-warning me-2">
                        <i class="fas fa-star"></i>
                        <i class="fas fa-star"></i>
                        <i class="fas fa-star"></i>
                        <i class="fas fa-star"></i>
                        <i class="fas fa-star-half-alt"></i>
                    </div>
                    <span class="text-muted small">120 customer reviews</span>
                </div>

                <div class="product-highlights-box">
                    <div class="highlight-item">
                        <i class="fas fa-check-circle"></i>
                        <span>Freshly harvested from ${product.category}.</span>
                    </div>
                    <div class="highlight-item">
                        <i class="fas fa-check-circle"></i>
                        <span>Available in ${product.unit} measurements.</span>
                    </div>
                    <div class="highlight-item">
                        <i class="fas fa-check-circle"></i>
                        <span>High quality organic produce.</span>
                    </div>
                    <div class="highlight-item">
                        <i class="fas fa-check-circle"></i>
                        <span>Supports local agriculture.</span>
                    </div>
                </div>

                <div class="mb-4">
                     <h3 class="fw-bold">₹${product.price
      } <span class="text-muted fs-5 fw-normal">/ ${product.unit
      }</span></h3>
                     <p class="text-muted small">
                        ${product.quantity > 0
        ? `<span class="text-success"><i class="fas fa-circle me-1" style="font-size: 8px;"></i>In Stock</span> (${product.quantity} ${product.unit} available)`
        : '<span class="text-danger">Out of Stock</span>'
      }
                     </p>
                </div>

                ${controlsHtml}

                <div class="accordion mt-5 related-accordion" id="productInfoAccordion">
                    <div class="accordion-item border-0 border-bottom">
                        <h2 class="accordion-header">
                            <button class="accordion-button collapsed fw-bold" type="button" data-bs-toggle="collapse" data-bs-target="#collapseInfo">
                                RELATED INFORMATION
                            </button>
                        </h2>
                        <div id="collapseInfo" class="accordion-collapse collapse" data-bs-parent="#productInfoAccordion">
                            <div class="accordion-body text-muted">
                                This product is sourced sustainably and ensures fair trade practices for our farmers.
                                Stored in optimal conditions to maintain freshness.
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

    window.currentProduct = product;
  }

  // Edit functions
  window.openEditModal = function () {
    const product = window.currentProduct;
    const modal = new bootstrap.Modal(
      document.getElementById("editProductModal")
    );

    document.getElementById("editProductName").value = product.name;
    document.getElementById("editProductDescription").value =
      product.description;
    document.getElementById("editProductPrice").value = product.price;
    document.getElementById("editProductQuantity").value = product.quantity;
    document.getElementById("editProductUnit").value = product.unit;
    document.getElementById("editProductCategory").value = product.category;

    const imageUrl =
      (product.images && product.images[0]) || product.imageUrl || "";
    document.getElementById("editProductImage").value = imageUrl;

    modal.show();
  };

  window.saveProductChanges = async function () {
    const product = window.currentProduct;
    const imageUrl = document.getElementById("editProductImage").value.trim();

    const updatedData = {
      name: document.getElementById("editProductName").value,
      description: document.getElementById("editProductDescription").value,
      price: parseFloat(document.getElementById("editProductPrice").value),
      quantity: parseInt(document.getElementById("editProductQuantity").value),
      unit: document.getElementById("editProductUnit").value,
      category: document.getElementById("editProductCategory").value,
      images: imageUrl ? [imageUrl] : [],
      isAvailable: product.isAvailable !== undefined ? product.isAvailable : true,
    };

    console.log("Debug Info:");
    console.log("Token User ID:", user._id);
    console.log("Product ID:", product._id);
    console.log("Product Farmer:", product.farmer);
    console.log("Payload:", updatedData);

    try {
      const response = await fetch(`${BACKEND_URL}/products/${product._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(updatedData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Server Error Response:", errorData);
        throw new Error(errorData.message || "Failed to update product");
      }

      const modalElement = document.getElementById("editProductModal");
      const modal = bootstrap.Modal.getInstance(modalElement);
      modal.hide();

      loadProductDetails(); // Reload to show changes
      alert("Product updated successfully!");
    } catch (error) {
      console.error(error);
      alert("Error updating product: " + error.message);
    }
  };

  window.deleteProduct = async function (id) {
    if (!confirm("Are you sure you want to delete this product?")) return;

    try {
      const response = await fetch(`${BACKEND_URL}/products/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error("Failed to delete product");

      alert("Product deleted");
      window.location.href = "products.html";
    } catch (e) {
      console.error(e);
      alert("Error deleting product");
    }
  };

  // Add to cart (copy from products.js)
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

  // Logout
  window.logout = function () {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "login.html";
  };
});
