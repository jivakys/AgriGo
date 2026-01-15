// Farmer Dashboard JavaScript
(function () {
  let isLoading = false;
  let currentProductId = null;
  const BACKEND_URL = "http://localhost:3000";

  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user"));

  if (!token || !user || user.role !== "farmer") {
    window.location.href = "login.html";
    return;
  }

  document.getElementById("farmerName").textContent = user.name;

  document
    .getElementById("dashboardLink")
    .addEventListener("click", showDashboard);
  document
    .getElementById("productsLink")
    .addEventListener("click", showProducts);
  document.getElementById("ordersLink").addEventListener("click", showOrders);
  document.getElementById("logoutBtn").addEventListener("click", handleLogout);
  document
    .getElementById("addProductBtn")
    .addEventListener("click", showAddProductModal);
  document
    .getElementById("saveProductBtn")
    .addEventListener("click", saveProduct);

  // Initial load
  showDashboard();
  checkBackendConnection()
    .then(() => {
      loadDashboardData();
      loadProducts();
      loadOrders();
    })
    .catch((error) => {
      console.error("Backend connection error:", error);
      showBackendError();
    });

  async function checkBackendConnection() {
    try {
      const response = await fetch(`${BACKEND_URL}/products/farmer/products`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      // Even if we get a 401 or 403, it means the server is running
      if (response.status === 401 || response.status === 403) {
        return; // Server is running but we're not authorized
      }

      if (!response.ok) {
        throw new Error("Backend server is not responding properly");
      }
    } catch (error) {
      if (error.message.includes("Failed to fetch")) {
        throw new Error(
          "Cannot connect to the backend server. Please make sure the server is running."
        );
      }
      throw error;
    }
  }

  function showBackendError() {
    const errorMessage = `
            <div class="alert alert-danger" role="alert">
                <h4 class="alert-heading">Connection Error</h4>
                <p>Cannot connect to the backend server. Please check:</p>
                <ul>
                    <li>Make sure the backend server is running</li>
                    <li>Check if the server is accessible at ${BACKEND_URL}</li>
                    <li>Verify your internet connection</li>
                    <li>Ensure the backend server is properly configured</li>
                </ul>
                <hr>
                <p class="mb-0">Try refreshing the page once the server is running.</p>
            </div>
        `;

    // Show error in all content sections
    ["dashboardContent", "productsContent", "ordersContent"].forEach(
      (sectionId) => {
        const section = document.getElementById(sectionId);
        if (section) {
          section.innerHTML = errorMessage;
        }
      }
    );
  }

  function showLoading(show) {
    isLoading = show;
    const loadingIndicator = document.getElementById("loadingIndicator");
    if (loadingIndicator) {
      loadingIndicator.style.display = show ? "block" : "none";
    }
  }

  function showDashboard() {
    document.getElementById("dashboardContent").style.display = "block";
    document.getElementById("productsContent").style.display = "none";
    document.getElementById("ordersContent").style.display = "none";
    updateActiveNav("dashboardLink");
  }

  function showProducts() {
    document.getElementById("dashboardContent").style.display = "none";
    document.getElementById("productsContent").style.display = "block";
    document.getElementById("ordersContent").style.display = "none";
    updateActiveNav("productsLink");
  }

  function showOrders() {
    document.getElementById("dashboardContent").style.display = "none";
    document.getElementById("productsContent").style.display = "none";
    document.getElementById("ordersContent").style.display = "block";
    updateActiveNav("ordersLink");
  }

  function updateActiveNav(activeId) {
    document.querySelectorAll(".nav-link").forEach((link) => {
      link.classList.remove("active");
    });
    document.getElementById(activeId).classList.add("active");
  }

  async function loadDashboardData() {
    if (isLoading) return;
    showLoading(true);
    try {
      const response = await fetch(`${BACKEND_URL}/orders/farmer`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error("Failed to fetch dashboard data");

      const data = await response.json();
      // document.getElementById("totalProducts").textContent =
      //   data.totalProducts || 0;
      document.getElementById("pendingOrders").textContent =
        data.pendingOrders || 0;
      document.getElementById("totalRevenue").textContent = `₹${data.totalRevenue || 0
        }`;

      const recentOrdersTable = document
        .getElementById("recentOrdersTable")
        .getElementsByTagName("tbody")[0];
      recentOrdersTable.innerHTML = "";

      if (Array.isArray(data.recentOrders)) {
        data.recentOrders.forEach((order) => {
          const row = recentOrdersTable.insertRow();
          row.innerHTML = `
                        <td>${order._id}</td>
                        <td>${order.consumerId?.name || "N/A"}</td>
                        <td>₹${order.totalAmount || 0}</td>
                        <td>${order.status || "N/A"}</td>
                        <td>${order.createdAt
              ? new Date(order.createdAt).toLocaleDateString()
              : "N/A"
            }</td>
                        <td>
                            <button class="btn btn-sm btn-primary" onclick="viewOrder('${order._id
            }')">View</button>
                        </td>
                    `;
        });
      }

      // Render Revenue Chart
      if (typeof Chart !== 'undefined') {
        renderRevenueChart(data.recentOrders || []);
      }

    } catch (error) {
      console.error("Error loading dashboard data:", error);
      if (error.message.includes("Failed to fetch")) {
        showBackendError();
      } else {
        alert("Failed to load dashboard data: " + error.message);
      }
    } finally {
      showLoading(false);
    }
  }

  async function loadProducts() {
    if (!isLoading) return;
    showLoading(true);
    try {
      const response = await fetch(`${BACKEND_URL}/products/farmer/products`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Error response:", errorData);
        throw new Error(errorData.message || "Failed to fetch products");
      }

      const products = await response.json();

      document.getElementById("totalProducts").textContent =
        products.length || 0;
      // console.log("Received products:", products);

      const productsGrid = document.getElementById("productsGrid");
      if (!productsGrid) {
        console.error("Products grid element not found");
        throw new Error("Products grid element not found");
      }

      productsGrid.innerHTML = "";

      if (!Array.isArray(products) || products.length === 0) {
        productsGrid.innerHTML = `
            <div class="col-12 text-center p-5">
                <i class="fas fa-box-open fa-3x text-muted mb-3"></i>
                <p class="text-muted">No products found. Start by adding a new product!</p>
            </div>`;
        return;
      }

      // console.log("Rendering products...");
      productsGrid.innerHTML = products
        .map(
          (product) => `
            <div class="col-md-4 mb-4" id="product-card-${product._id}">
                <div class="card h-100 product-card shadow-sm border-0 rounded-4 overflow-hidden">
                    <div class="position-relative">
                        <img src="${(product.images && product.images[0]) ||
            product.imageUrl ||
            "https://placehold.co/600x400?text=No+Image"
            }" class="card-img-top" alt="${product.name
            }" style="height: 250px; object-fit: cover;">
                        ${product.quantity === 0
              ? '<span class="position-absolute top-0 end-0 badge bg-danger m-3">Out of Stock</span>'
              : ""
            }
                        <span class="position-absolute top-0 start-0 badge ${product.isAvailable ? "bg-success" : "bg-warning"
            } m-3">
                            ${product.isAvailable ? "Available" : "Unavailable"}
                        </span>
                    </div>
                    <div class="card-body d-flex flex-column p-4">
                        <div class="d-flex justify-content-between align-items-start mb-2">
                            <div>
                                <h5 class="card-title fw-bold mb-1 fs-4 text-dark">${product.name
            }</h5>
                                <p class="text-muted small mb-0"><i class="fas fa-tag me-1"></i>${product.category || "N/A"
            }</p>
                            </div>
                            <h4 class="text-success fw-bold mb-0">₹${product.price
            }</h4>
                        </div>
                        
                        <p class="card-text text-secondary mb-4 flex-grow-1" style="display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">
                            ${product.description}
                        </p>
                        
                        <div class="d-flex justify-content-between align-items-center mb-3">
                            <span class="badge bg-light text-dark border">
                                <i class="fas fa-cubes me-1"></i> Stock: ${product.quantity
            } ${product.unit}
                            </span>
                        </div>

                        <div class="mt-auto d-grid gap-2">
                             
                            <div class="row g-2">
                                <div class="col-6">
                                    <button class="btn btn-outline-primary w-100 rounded-pill" onclick="editProduct('${product._id
            }')">
                                        <i class="fas fa-edit me-1"></i> Edit
                                    </button>
                                </div>
                                <div class="col-6">
                                    <button class="btn btn-outline-danger w-100 rounded-pill" onclick="deleteProduct('${product._id
            }')">
                                        <i class="fas fa-trash me-1"></i> Delete
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `
        )
        .join("");
      console.log("Products rendered successfully");
    } catch (error) {
      console.error("Error loading products:", error);
      const productsGrid = document.getElementById("productsGrid");
      if (productsGrid) {
        productsGrid.innerHTML = `
            <div class="col-12 text-center text-danger p-5">
                <i class="fas fa-exclamation-circle fa-2x mb-3"></i>
                <p>Error loading products: ${error.message}</p>
            </div>
        `;
      }
      alert("Failed to load products: " + error.message);
    } finally {
      showLoading(false);
    }
  }

  async function loadOrders() {
    if (isLoading) return;
    showLoading(true);
    try {
      const response = await fetch(`${BACKEND_URL}/orders/farmer`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error("Failed to fetch orders");

      const orders = await response.json();
      const ordersTable = document
        .getElementById("ordersTable")
        .getElementsByTagName("tbody")[0];
      ordersTable.innerHTML = "";

      if (orders.length === 0) {
        const row = ordersTable.insertRow();
        row.innerHTML =
          '<td colspan="7" class="text-center">No orders found</td>';
        return;
      }

      orders.forEach((order) => {
        const row = ordersTable.insertRow();
        row.innerHTML = `
                    <td>${order._id}</td>
                    <td>${order.consumerId.name}</td>
                    <td>${order.products.map((p) => p.name).join(", ")}</td>
                    <td>₹${order.totalAmount}</td>
                    <td>${order.status}</td>
                    <td>${new Date(order.createdAt).toLocaleDateString()}</td>
                    <td>
                        <button class="btn btn-sm btn-primary" onclick="viewOrder('${order._id
          }')">View</button>
                        <button class="btn btn-sm btn-success" onclick="updateOrderStatus('${order._id
          }', 'completed')">Complete</button>
                    </td>
                `;
      });
    } catch (error) {
      console.error("Error loading orders:", error);
      alert("Failed to load orders: " + error.message);
    } finally {
      showLoading(false);
    }
  }

  function showAddProductModal() {
    const modal = new bootstrap.Modal(document.getElementById("productModal"));
    document.getElementById("productModalLabel").textContent =
      "Add New Product";
    document.getElementById("productForm").reset();
    currentProductId = null;

    // Remove aria-hidden
    const modalElement = document.getElementById("productModal");
    modalElement.removeAttribute("aria-hidden");

    modal.show();

    // Focus on the first input when modal opens
    setTimeout(() => {
      document.getElementById("productName").focus();
    }, 100);
  }

  function showEditProductModal(product) {
    const modal = new bootstrap.Modal(document.getElementById("productModal"));
    document.getElementById("productModalLabel").textContent = "Edit Product";
    document.getElementById("productName").value = product.name;
    document.getElementById("productCategory").value = product.category;
    document.getElementById("productPrice").value = product.price;
    document.getElementById("productQuantity").value = product.quantity;
    document.getElementById("productUnit").value = product.unit;
    document.getElementById("productDescription").value = product.description;

    // Handle image
    const imageUrl =
      (product.images && product.images[0]) || product.imageUrl || "";
    document.getElementById("productImage").value = imageUrl;

    document.getElementById("productAvailable").checked = product.isAvailable;

    currentProductId = product._id;

    // Remove aria-hidden
    const modalElement = document.getElementById("productModal");
    modalElement.removeAttribute("aria-hidden");

    modal.show();

    // Focus on the first input when modal opens
    setTimeout(() => {
      document.getElementById("productName").focus();
    }, 100);
  }

  async function saveProduct() {
    if (isLoading) return;
    showLoading(true);

    // Get form values
    const name = document.getElementById("productName").value.trim();
    const category = document.getElementById("productCategory").value;
    const price = parseFloat(document.getElementById("productPrice").value);
    const quantity = parseInt(document.getElementById("productQuantity").value);
    const unit = document.getElementById("productUnit").value;
    const description = document
      .getElementById("productDescription")
      .value.trim();
    const imageUrl = document.getElementById("productImage").value.trim();
    const isAvailable = document.getElementById("productAvailable").checked;

    // Validate required fields
    if (!name) {
      alert("Product name is required");
      showLoading(false);
      return;
    }
    if (!category) {
      alert("Category is required");
      showLoading(false);
      return;
    }
    if (isNaN(price) || price <= 0) {
      alert("Please enter a valid price");
      showLoading(false);
      return;
    }
    if (isNaN(quantity) || quantity < 0) {
      alert("Please enter a valid quantity");
      showLoading(false);
      return;
    }
    if (!unit) {
      alert("Unit is required");
      showLoading(false);
      return;
    }
    if (!description) {
      alert("Description is required");
      showLoading(false);
      return;
    }

    const productData = {
      name,
      category,
      price,
      quantity,
      unit,
      description,
      images: imageUrl ? [imageUrl] : [],
      isAvailable,
    };

    const isEditing = currentProductId !== null;
    let previousCardHTML = "";

    // OPTIMISTIC UI UPDATE
    if (isEditing) {
      const cardToCheck = document.getElementById(`product-card-${currentProductId}`);
      if (cardToCheck) {
        previousCardHTML = cardToCheck.innerHTML;
        updateProductCardUI(currentProductId, productData);
      }
    }

    // Close modal immediately
    const modal = bootstrap.Modal.getInstance(document.getElementById("productModal"));
    if (modal) {
      const modalElement = document.getElementById("productModal");
      modalElement.setAttribute("aria-hidden", "true");
      modal.hide();
    }

    // Reset form immediately
    document.getElementById("productForm").reset();
    const tempId = currentProductId;
    currentProductId = null;

    try {
      const url = isEditing
        ? `${BACKEND_URL}/products/${tempId}`
        : `${BACKEND_URL}/products`;
      const method = isEditing ? "PUT" : "POST";

      const response = await fetch(url, {
        method: method,
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(productData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to save product");
      }

      // If new product, we must reload to show it
      if (!isEditing) {
        await loadProducts();
      }

      loadDashboardData();

    } catch (error) {
      console.error("Error saving product:", error);
      alert(error.message || "Failed to save product");

      // ROLLBACK UI
      if (isEditing && previousCardHTML) {
        const cardToRevert = document.getElementById(`product-card-${tempId}`);
        if (cardToRevert) {
          cardToRevert.innerHTML = previousCardHTML;
        }
      } else if (isEditing) {
        loadProducts();
      }
    } finally {
      showLoading(false);
    }
  }

  function updateProductCardUI(id, data) {
    const card = document.getElementById(`product-card-${id}`);
    if (!card) return;

    const imageUrl = (data.images && data.images[0]) || data.imageUrl || "https://placehold.co/600x400?text=No+Image";

    card.innerHTML = `
                <div class="card h-100 product-card shadow-sm border-0 rounded-4 overflow-hidden">
                    <div class="position-relative">
                        <img src="${imageUrl}" class="card-img-top" alt="${data.name}" style="height: 250px; object-fit: cover;">
                        ${data.quantity === 0
        ? '<span class="position-absolute top-0 end-0 badge bg-danger m-3">Out of Stock</span>'
        : ""
      }
                        <span class="position-absolute top-0 start-0 badge ${data.isAvailable ? "bg-success" : "bg-warning"
      } m-3">
                            ${data.isAvailable ? "Available" : "Unavailable"}
                        </span>
                    </div>
                    <div class="card-body d-flex flex-column p-4">
                        <div class="d-flex justify-content-between align-items-start mb-2">
                            <div>
                                <h5 class="card-title fw-bold mb-1 fs-4 text-dark">${data.name}</h5>
                                <p class="text-muted small mb-0"><i class="fas fa-tag me-1"></i>${data.category || "N/A"}</p>
                            </div>
                            <h4 class="text-success fw-bold mb-0">₹${data.price}</h4>
                        </div>
                        
                        <p class="card-text text-secondary mb-4 flex-grow-1" style="display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">
                            ${data.description}
                        </p>
                        
                        <div class="d-flex justify-content-between align-items-center mb-3">
                            <span class="badge bg-light text-dark border">
                                <i class="fas fa-cubes me-1"></i> Stock: ${data.quantity} ${data.unit}
                            </span>
                        </div>

                        <div class="mt-auto d-grid gap-2">
                             <a href="product-details.html?id=${id}" class="btn btn-outline-secondary rounded-pill">
                                Show Details
                            </a>
                            <div class="row g-2">
                                <div class="col-6">
                                    <button class="btn btn-outline-primary w-100 rounded-pill" onclick="editProduct('${id}')">
                                        <i class="fas fa-edit me-1"></i> Edit
                                    </button>
                                </div>
                                <div class="col-6">
                                    <button class="btn btn-outline-danger w-100 rounded-pill" onclick="deleteProduct('${id}')">
                                        <i class="fas fa-trash me-1"></i> Delete
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
      `;
  }

  function handleLogout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "login.html";
  }

  // Make functions available globally
  window.viewOrder = async function (orderId) {
    if (isLoading) return;
    showLoading(true);
    try {
      const response = await fetch(`${BACKEND_URL}/orders/${orderId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error("Failed to fetch order details");

      const order = await response.json();
      alert(
        `Order Details:\nID: ${order._id}\nCustomer: ${order.consumerId.name}\nStatus: ${order.status}\nTotal: ₹${order.totalAmount}`
      );
    } catch (error) {
      console.error("Error viewing order:", error);
      alert("Failed to load order details: " + error.message);
    } finally {
      showLoading(false);
    }
  };

  window.updateOrderStatus = async function (orderId, status) {
    if (isLoading) return;
    showLoading(true);
    try {
      const response = await fetch(`${BACKEND_URL}/orders/${orderId}/status`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status }),
      });

      if (!response.ok) throw new Error("Failed to update order status");

      await loadOrders();
      await loadDashboardData();
      alert("Order status updated successfully");
    } catch (error) {
      console.error("Error updating order status:", error);
      alert("Failed to update order status: " + error.message);
    } finally {
      showLoading(false);
    }
  };

  window.editProduct = async function (productId) {
    if (isLoading) return;
    showLoading(true);
    try {
      const response = await fetch(`${BACKEND_URL}/products/${productId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to fetch product details");
      }

      const product = await response.json();
      showEditProductModal(product);
    } catch (error) {
      console.error("Error editing product:", error);
      alert("Failed to load product details: " + error.message);
    } finally {
      showLoading(false);
    }
  };

  window.deleteProduct = async function (productId) {
    if (isLoading) return;
    if (!confirm("Are you sure you want to delete this product?")) return;

    showLoading(true);
    try {
      const response = await fetch(`${BACKEND_URL}/products/${productId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error("Failed to delete product");

      await loadProducts();
      await loadDashboardData();
      alert("Product deleted successfully");
    } catch (error) {
      console.error("Error deleting product:", error);
      alert("Failed to delete product: " + error.message);
    } finally {
      showLoading(false);
    }
  };
})();
