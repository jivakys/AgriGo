// Order Management Functions
document.addEventListener("DOMContentLoaded", function () {
  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user"));
  const BACKEND_URL = "http://localhost:3000";

  // Check authentication
  if (!token || !user) {
    window.location.href = "login.html";
    return;
  }

  let allOrders = [];
  let currentFilter = "all";

  // Initialize
  loadOrders();
  setupFilters();

  // Load orders based on user role
  async function loadOrders() {
    try {
      const endpoint =
        user.role === "farmer"
          ? `${BACKEND_URL}/orders/farmer`
          : `${BACKEND_URL}/orders/consumer`;
      const response = await fetch(endpoint, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to load orders");
      }

      allOrders = await response.json();
      displayOrders(allOrders);
    } catch (error) {
      console.error("Error loading orders:", error);
      showToast("Failed to load orders", "error");
    }
  }

  // Setup filter buttons
  function setupFilters() {
    const filterAll = document.getElementById("filterAll");
    const filterPending = document.getElementById("filterPending");
    const filterCompleted = document.getElementById("filterCompleted");
    const filterCancelled = document.getElementById("filterCancelled");

    if (filterAll) {
      filterAll.addEventListener("click", () => filterOrders("all"));
    }
    if (filterPending) {
      filterPending.addEventListener("click", () => filterOrders("pending"));
    }
    if (filterCompleted) {
      filterCompleted.addEventListener("click", () => filterOrders("delivered"));
    }
    if (filterCancelled) {
      filterCancelled.addEventListener("click", () => filterOrders("cancelled"));
    }
  }

  // Filter orders
  function filterOrders(status) {
    currentFilter = status;
    updateFilterButtons();

    let filteredOrders = allOrders;
    if (status !== "all") {
      filteredOrders = allOrders.filter((order) => order.status === status);
    }

    displayOrders(filteredOrders);
  }

  // Update filter button states
  function updateFilterButtons() {
    const buttons = {
      filterAll: document.getElementById("filterAll"),
      filterPending: document.getElementById("filterPending"),
      filterCompleted: document.getElementById("filterCompleted"),
      filterCancelled: document.getElementById("filterCancelled"),
    };

    Object.keys(buttons).forEach((key) => {
      if (buttons[key]) {
        buttons[key].classList.remove("active");
      }
    });

    const activeMap = {
      all: "filterAll",
      pending: "filterPending",
      delivered: "filterCompleted",
      cancelled: "filterCancelled",
    };

    if (buttons[activeMap[currentFilter]]) {
      buttons[activeMap[currentFilter]].classList.add("active");
    }
  }

  // Display orders in the UI
  function displayOrders(orders) {
    const ordersContainer = document.getElementById("ordersContainer");
    if (!ordersContainer) return;

    if (orders.length === 0) {
      ordersContainer.innerHTML = `
        <div class="text-center py-5">
          <i class="fas fa-box-open fa-3x text-muted mb-3"></i>
          <h4>No orders found</h4>
          <p class="text-muted">${currentFilter === "all" ? "You haven't placed any orders yet." : `No ${currentFilter} orders found.`}</p>
          ${user.role === "consumer" ? '<a href="products.html" class="btn btn-success mt-3">Browse Products</a>' : ''}
        </div>
      `;
      return;
    }

    // Sort orders by date (newest first)
    orders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    ordersContainer.innerHTML = orders
      .map((order) => {
        const orderDate = new Date(order.createdAt);
        const statusInfo = getStatusInfo(order.status);
        const progressSteps = getProgressSteps(order.status);

        return `
          <div class="card mb-4 shadow-sm order-card">
            <div class="card-header bg-white d-flex justify-content-between align-items-center">
              <div>
                <h5 class="mb-0">Order #${order._id.slice(-8).toUpperCase()}</h5>
                <small class="text-muted">Placed on ${orderDate.toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })} at ${orderDate.toLocaleTimeString("en-IN", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}</small>
              </div>
              <span class="badge ${statusInfo.badgeClass} fs-6 px-3 py-2">
                <i class="${statusInfo.icon} me-1"></i>${statusInfo.label}
              </span>
            </div>
            <div class="card-body">
              <!-- Order Progress Timeline -->
              <div class="order-progress mb-4">
                ${progressSteps}
              </div>

              <!-- Order Details -->
              <div class="row mb-3">
                <div class="col-md-6">
                  <h6 class="text-muted mb-2">
                    <i class="fas fa-user me-2"></i>${user.role === "farmer" ? "Customer" : "Farmer"} Details
                  </h6>
                  <p class="mb-1"><strong>Name:</strong> ${
                    user.role === "farmer"
                      ? order.consumerId?.name || "N/A"
                      : order.farmerId?.name || "N/A"
                  }</p>
                  <p class="mb-1"><strong>Contact:</strong> ${
                    user.role === "farmer"
                      ? order.consumerId?.phone || "N/A"
                      : order.farmerId?.phone || "N/A"
                  }</p>
                  ${user.role === "farmer" && order.deliveryAddress
                    ? `
                    <p class="mb-1"><strong>Delivery Address:</strong></p>
                    <p class="mb-0 small">${order.deliveryAddress.street}, ${order.deliveryAddress.city} - ${order.deliveryAddress.pincode}</p>
                  `
                    : ""
                  }
                </div>
                <div class="col-md-6">
                  <h6 class="text-muted mb-2">
                    <i class="fas fa-info-circle me-2"></i>Order Summary
                  </h6>
                  <p class="mb-1"><strong>Total Amount:</strong> <span class="text-success fs-5">₹${order.totalAmount}</span></p>
                  <p class="mb-1"><strong>Payment Method:</strong> ${order.paymentMethod?.toUpperCase() || "N/A"}</p>
                  <p class="mb-0"><strong>Payment Status:</strong> <span class="badge bg-${order.paymentStatus === "paid" ? "success" : "warning"}">${order.paymentStatus || "pending"}</span></p>
                </div>
              </div>

              <!-- Products List -->
              <div class="products-section">
                <h6 class="text-muted mb-3">
                  <i class="fas fa-shopping-bag me-2"></i>Products (${order.products.length})
                </h6>
                <div class="table-responsive">
                  <table class="table table-sm">
                    <thead>
                      <tr>
                        <th>Product</th>
                        <th>Quantity</th>
                        <th>Unit Price</th>
                        <th>Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${order.products
                        .map(
                          (item) => `
                        <tr>
                          <td>${item.productId?.name || "N/A"}</td>
                          <td>${item.quantity} ${item.productId?.unit || ""}</td>
                          <td>₹${item.price}</td>
                          <td><strong>₹${item.quantity * item.price}</strong></td>
                        </tr>
                      `
                        )
                        .join("")}
                    </tbody>
                  </table>
                </div>
              </div>

              <!-- Action Buttons -->
              <div class="mt-3 pt-3 border-top">
                ${getActionButtons(order, user.role)}
              </div>
            </div>
          </div>
        `;
      })
      .join("");
  }

  // Get status information
  function getStatusInfo(status) {
    const statusMap = {
      pending: {
        label: "Pending",
        icon: "fas fa-clock",
        badgeClass: "bg-warning text-dark",
        color: "#ffc107",
      },
      confirmed: {
        label: "Confirmed",
        icon: "fas fa-check-circle",
        badgeClass: "bg-primary",
        color: "#0d6efd",
      },
      out_for_delivery: {
        label: "Out for Delivery",
        icon: "fas fa-truck",
        badgeClass: "bg-info",
        color: "#0dcaf0",
      },
      delivered: {
        label: "Delivered",
        icon: "fas fa-check-double",
        badgeClass: "bg-success",
        color: "#198754",
      },
      cancelled: {
        label: "Cancelled",
        icon: "fas fa-times-circle",
        badgeClass: "bg-danger",
        color: "#dc3545",
      },
    };

    return statusMap[status] || statusMap.pending;
  }

  // Get progress steps
  function getProgressSteps(status) {
    const steps = [
      { key: "pending", label: "Order Placed", icon: "fa-shopping-cart" },
      { key: "confirmed", label: "Confirmed", icon: "fa-check" },
      { key: "out_for_delivery", label: "Out for Delivery", icon: "fa-truck" },
      { key: "delivered", label: "Delivered", icon: "fa-check-double" },
    ];

    const statusOrder = ["pending", "confirmed", "out_for_delivery", "delivered"];
    const currentIndex = statusOrder.indexOf(status);
    const isCancelled = status === "cancelled";

    return `
      <div class="progress-steps">
        ${steps
          .map((step, index) => {
            const stepIndex = statusOrder.indexOf(step.key);
            const isCompleted = !isCancelled && stepIndex <= currentIndex;
            const isCurrent = !isCancelled && stepIndex === currentIndex;
            const isPending = stepIndex > currentIndex;

            return `
              <div class="progress-step ${isCompleted ? "completed" : ""} ${isCurrent ? "current" : ""} ${isPending ? "pending" : ""}">
                <div class="step-icon">
                  <i class="fas ${step.icon}"></i>
                </div>
                <div class="step-label">${step.label}</div>
              </div>
              ${index < steps.length - 1 ? '<div class="step-connector"></div>' : ""}
            `;
          })
          .join("")}
      </div>
    `;
  }

  // Get action buttons based on role and status
  function getActionButtons(order, role) {
    if (role === "farmer") {
      // Farmer actions
      if (order.status === "pending") {
        return `
          <button class="btn btn-success me-2" onclick="updateOrderStatus('${order._id}', 'confirmed')">
            <i class="fas fa-check me-1"></i>Confirm Order
          </button>
          <button class="btn btn-danger" onclick="updateOrderStatus('${order._id}', 'cancelled')">
            <i class="fas fa-times me-1"></i>Cancel Order
          </button>
        `;
      } else if (order.status === "confirmed") {
        return `
          <button class="btn btn-info text-white me-2" onclick="updateOrderStatus('${order._id}', 'out_for_delivery')">
            <i class="fas fa-truck me-1"></i>Mark Out for Delivery
          </button>
          <button class="btn btn-danger" onclick="updateOrderStatus('${order._id}', 'cancelled')">
            <i class="fas fa-times me-1"></i>Cancel Order
          </button>
        `;
      } else if (order.status === "out_for_delivery") {
        return `
          <button class="btn btn-success" onclick="updateOrderStatus('${order._id}', 'delivered')">
            <i class="fas fa-check-double me-1"></i>Mark as Delivered
          </button>
        `;
      } else if (order.status === "delivered") {
        return `
          <span class="text-success">
            <i class="fas fa-check-circle me-1"></i>Order completed successfully
          </span>
        `;
      } else if (order.status === "cancelled") {
        return `
          <span class="text-danger">
            <i class="fas fa-times-circle me-1"></i>Order has been cancelled
          </span>
        `;
      }
    } else {
      // Consumer actions
      if (order.status === "pending") {
        return `
          <button class="btn btn-outline-danger" onclick="cancelOrder('${order._id}')">
            <i class="fas fa-times me-1"></i>Cancel Order
          </button>
        `;
      } else if (order.status === "delivered") {
        return `
          <span class="text-success">
            <i class="fas fa-check-circle me-1"></i>Order delivered successfully
          </span>
        `;
      } else if (order.status === "cancelled") {
        return `
          <span class="text-danger">
            <i class="fas fa-times-circle me-1"></i>Order has been cancelled
          </span>
        `;
      } else {
        return `
          <span class="text-info">
            <i class="fas fa-info-circle me-1"></i>Your order is being processed
          </span>
        `;
      }
    }
    return "";
  }

  // Update order status (farmer only)
  window.updateOrderStatus = async function (orderId, status) {
    if (!confirm(`Are you sure you want to ${status === "cancelled" ? "cancel" : `mark as ${status.replace("_", " ")}`} this order?`)) {
      return;
    }

    try {
      const response = await fetch(`${BACKEND_URL}/orders/${orderId}/status`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Failed to update order status");
      }

      showToast("Order status updated successfully!", "success");
      await loadOrders(); // Refresh orders list
    } catch (error) {
      console.error("Error updating order status:", error);
      showToast(error.message || "Failed to update order status", "error");
    }
  };

  // Cancel order (consumer only)
  window.cancelOrder = async function (orderId) {
    if (!confirm("Are you sure you want to cancel this order?")) return;

    try {
      const response = await fetch(`${BACKEND_URL}/orders/${orderId}/cancel`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Failed to cancel order");
      }

      showToast("Order cancelled successfully!", "success");
      await loadOrders();
    } catch (error) {
      console.error("Error cancelling order:", error);
      showToast(error.message || "Failed to cancel order", "error");
    }
  };

  // Toast notification helper
  function showToast(message, type = "success") {
    if (typeof Toast !== "undefined") {
      Toast[type](message);
    } else {
      alert(message);
    }
  }
});
