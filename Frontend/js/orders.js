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
  setupFilters();
  loadOrders();

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
      if (user.role === "consumer") {
        updateFilterTabs();
      }
    } catch (error) {
      console.error("Error loading orders:", error);
      showToast("Failed to load orders", "error");
    }
  }

  // Setup filter buttons/tabs based on user role
  function setupFilters() {
    if (user.role === "consumer") {
      // Show tabs for consumers
      const orderTabs = document.getElementById("orderTabs");
      const filterButtons = document.getElementById("filterButtons");
      if (orderTabs) orderTabs.style.display = "flex";
      if (filterButtons) filterButtons.style.display = "none";

      // Setup tab listeners
      const tabs = document.querySelectorAll(".order-tab");
      tabs.forEach((tab) => {
        tab.addEventListener("click", () => {
          const status = tab.getAttribute("data-status");
          filterOrders(status);
        });
      });
    } else {
      // Show buttons for farmers
      const orderTabs = document.getElementById("orderTabs");
      const filterButtons = document.getElementById("filterButtons");
      if (orderTabs) orderTabs.style.display = "none";
      if (filterButtons) filterButtons.style.display = "block";

      // Setup button listeners
      const filterAllBtn = document.getElementById("filterAllBtn");
      const filterPendingBtn = document.getElementById("filterPendingBtn");
      const filterCompletedBtn = document.getElementById("filterCompletedBtn");
      const filterCancelledBtn = document.getElementById("filterCancelledBtn");

      if (filterAllBtn) filterAllBtn.addEventListener("click", () => filterOrders("all"));
      if (filterPendingBtn) filterPendingBtn.addEventListener("click", () => filterOrders("pending"));
      if (filterCompletedBtn) filterCompletedBtn.addEventListener("click", () => filterOrders("delivered"));
      if (filterCancelledBtn) filterCancelledBtn.addEventListener("click", () => filterOrders("cancelled"));
    }
  }

  // Filter orders
  function filterOrders(status) {
    currentFilter = status;
    
    if (user.role === "consumer") {
      updateFilterTabs();
    } else {
      updateFilterButtons();
    }

    let filteredOrders = allOrders;
    if (status === "shipping") {
      // Shipping includes pending, confirmed, and out_for_delivery
      filteredOrders = allOrders.filter((order) => 
        order.status === "pending" || 
        order.status === "confirmed" || 
        order.status === "out_for_delivery"
      );
    } else if (status !== "all") {
      filteredOrders = allOrders.filter((order) => order.status === status);
    }

    displayOrders(filteredOrders);
  }

  // Update filter tab states and counts (for consumers)
  function updateFilterTabs() {
    const tabs = document.querySelectorAll(".order-tab");
    tabs.forEach((tab) => {
      tab.classList.remove("active");
    });

    const activeTab = document.querySelector(`[data-status="${currentFilter}"]`);
    if (activeTab) {
      activeTab.classList.add("active");
    }

    // Update counts
    const shippingCount = allOrders.filter(order => 
      order.status === "pending" || 
      order.status === "confirmed" || 
      order.status === "out_for_delivery"
    ).length;
    const deliveredCount = allOrders.filter(order => order.status === "delivered").length;
    const cancelledCount = allOrders.filter(order => order.status === "cancelled").length;

    const countAllEl = document.getElementById("countAll");
    const countShippingEl = document.getElementById("countShipping");
    const countDeliveredEl = document.getElementById("countDelivered");
    const countCancelledEl = document.getElementById("countCancelled");

    if (countAllEl) countAllEl.textContent = allOrders.length;
    if (countShippingEl) countShippingEl.textContent = shippingCount;
    if (countDeliveredEl) countDeliveredEl.textContent = deliveredCount;
    if (countCancelledEl) countCancelledEl.textContent = cancelledCount;
  }

  // Update filter button states (for farmers)
  function updateFilterButtons() {
    const buttons = {
      filterAll: document.getElementById("filterAllBtn"),
      filterPending: document.getElementById("filterPendingBtn"),
      filterCompleted: document.getElementById("filterCompletedBtn"),
      filterCancelled: document.getElementById("filterCancelledBtn"),
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

    // For consumers, use 3-column grid layout
    if (user.role === "consumer") {
      ordersContainer.className = "row g-4";
    } else {
      ordersContainer.className = "row g-4"; // Also use grid for farmers for consistency
    }

    const orderCards = orders
      .map((order) => {
        const orderDate = new Date(order.createdAt);
        const statusInfo = getStatusInfo(order.status);
        
        // Calculate estimated arrival (7 days from order date for demo)
        const estimatedArrival = new Date(orderDate);
        estimatedArrival.setDate(estimatedArrival.getDate() + 7);
        
        // Get origin and destination
        const origin = user.role === "farmer" 
          ? (order.farmerId?.name ? `${order.farmerId.name}'s Farm` : "Farm Location")
          : (order.farmerId?.name ? `${order.farmerId.name}'s Farm` : "Farm Location");
        const destination = user.role === "farmer"
          ? (order.deliveryAddress?.city || "Delivery Location")
          : (order.deliveryAddress?.city || "Your Location");

        // Generate product items HTML with images (side-by-side cards)
        const productItems = order.products.map((item) => {
          const productImage = item.productId?.images?.[0] || item.productId?.imageUrl || "https://placehold.co/80x80?text=No+Image";
          return `
            <div class="order-product-mini-card">
              <div class="product-img-wrapper">
                <img src="${productImage}" alt="${item.productId?.name || 'Product'}" class="product-thumb">
              </div>
              <div class="product-details">
                <div class="product-name">${item.productId?.name || "N/A"}</div>
                <div class="product-price">₹${item.price.toLocaleString('en-IN')} <span class="qty text-muted">x${item.quantity}</span></div>
                ${item.productId?.unit ? `<div class="product-info-small">Unit: ${item.productId.unit}</div>` : ''}
              </div>
            </div>
          `;
        }).join("");

        const cardClass = "col-lg-4 col-md-6 col-12";
        return `
          <div class="${cardClass}">
            <div class="order-card-compact h-100">
            <div class="order-header-compact">
              <div class="order-id-section">
                <span class="order-id-label">Order ID</span>
                <span class="order-id-value">#${order._id.slice(-7).toUpperCase()}</span>
              </div>
              <div class="arrival-status">
                <div class="est-arrival-pod">
                  <span class="pod-label">Estimated arrival:</span>
                  <span class="pod-date">${estimatedArrival.toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                    year: "numeric"
                  })}</span>
                </div>
                <span class="badge status-badge-minimal ${statusInfo.badgeClass}">
                  ${statusInfo.label}
                </span>
              </div>
            </div>
            
            <div class="shipping-viz">
              <div class="route-item">
                <div class="route-icon origin"><i class="fas fa-truck"></i></div>
                <span class="route-text">${origin}</span>
              </div>
              <div class="route-connector">
                <div class="dotted-line"></div>
                <i class="fas fa-caret-right"></i>
              </div>
              <div class="route-item text-end">
                <div class="route-icon destination"><i class="fas fa-map-marker-alt"></i></div>
                <span class="route-text">${destination}</span>
              </div>
            </div>
<div class="order-products-container">
              ${productItems}
            </div>

            <div class="order-footer-compact">
              <div class="order-total-section">
                <span class="total-val">₹${order.totalAmount.toLocaleString('en-IN')}</span>
                <span class="item-count-text">(${order.products.length} ${order.products.length === 1 ? 'Item' : 'Items'})</span>
              </div>
              <div class="order-actions-compact">
                ${getActionButtons(order, user.role)}
                <button class="btn btn-details-minimal" onclick="showOrderDetails('${order._id}')">
                  Details
                </button>
              </div>
            </div>
          </div>
          </div>
        `;
      })
      .join("");

    ordersContainer.innerHTML = orderCards;
  }

  // Get status information (different labels for consumers vs farmers)
  function getStatusInfo(status) {
    if (user.role === "consumer") {
      // Consumer status labels (matching image)
      const consumerStatusMap = {
        pending: {
          label: "On Process",
          icon: "fas fa-clock",
          badgeClass: "status-on-process",
          color: "#0d6efd",
        },
        confirmed: {
          label: "On Process",
          icon: "fas fa-check-circle",
          badgeClass: "status-on-process",
          color: "#0d6efd",
        },
        out_for_delivery: {
          label: "On Deliver",
          icon: "fas fa-truck",
          badgeClass: "status-on-deliver",
          color: "#28a745",
        },
        delivered: {
          label: "Arrived",
          icon: "fas fa-check-double",
          badgeClass: "status-arrived",
          color: "#198754",
        },
        cancelled: {
          label: "Canceled",
          icon: "fas fa-times-circle",
          badgeClass: "status-cancelled",
          color: "#dc3545",
        },
      };
      return consumerStatusMap[status] || consumerStatusMap.pending;
    } else {
      // Farmer status labels
      const farmerStatusMap = {
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
      return farmerStatusMap[status] || farmerStatusMap.pending;
    }
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

  // Get action buttons based on role and status (compact version)
  function getActionButtons(order, role) {
    if (role === "farmer") {
      // Farmer actions - compact buttons
      if (order.status === "pending") {
        return `
          <button class="btn btn-success btn-sm me-1" onclick="updateOrderStatus('${order._id}', 'confirmed')" title="Confirm Order">
            <i class="fas fa-check"></i>
          </button>
          <button class="btn btn-danger btn-sm" onclick="updateOrderStatus('${order._id}', 'cancelled')" title="Cancel Order">
            <i class="fas fa-times"></i>
          </button>
        `;
      } else if (order.status === "confirmed") {
        return `
          <button class="btn btn-info btn-sm text-white me-1" onclick="updateOrderStatus('${order._id}', 'out_for_delivery')" title="Mark Out for Delivery">
            <i class="fas fa-truck"></i>
          </button>
          <button class="btn btn-danger btn-sm" onclick="updateOrderStatus('${order._id}', 'cancelled')" title="Cancel Order">
            <i class="fas fa-times"></i>
          </button>
        `;
      } else if (order.status === "out_for_delivery") {
        return `
          <button class="btn btn-success btn-sm" onclick="updateOrderStatus('${order._id}', 'delivered')" title="Mark as Delivered">
            <i class="fas fa-check-double"></i>
          </button>
        `;
      }
    } else {
      // Consumer actions - compact buttons
      if (order.status === "pending") {
        return `
          <button class="btn btn-outline-danger btn-sm" onclick="cancelOrder('${order._id}')" title="Cancel Order">
            <i class="fas fa-times"></i>
          </button>
        `;
      }
    }
    return "";
  }

  // Show order details in modal
  window.showOrderDetails = async function (orderId) {
    try {
      const endpoint = user.role === "farmer"
        ? `${BACKEND_URL}/orders/${orderId}`
        : `${BACKEND_URL}/orders/${orderId}`;
      
      const response = await fetch(endpoint, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to load order details");
      }

      const order = await response.json();
      const orderDate = new Date(order.createdAt);
      const statusInfo = getStatusInfo(order.status);
      const progressSteps = getProgressSteps(order.status);

      // Build modal content
      const modalContent = `
        <div class="order-details-modal">
          <div class="row mb-4">
            <div class="col-md-6">
              <h6 class="text-muted text-uppercase small fw-bold mb-3">Order Information</h6>
              <p class="mb-2"><strong>Order ID:</strong> #${order._id.slice(-7).toUpperCase()}</p>
              <p class="mb-2"><strong>Date:</strong> ${orderDate.toLocaleDateString("en-IN", {
                day: "numeric",
                month: "long",
                year: "numeric"
              })} at ${orderDate.toLocaleTimeString("en-IN", {
                hour: "2-digit",
                minute: "2-digit"
              })}</p>
              <p class="mb-2"><strong>Status:</strong> <span class="badge ${statusInfo.badgeClass}">${statusInfo.label}</span></p>
              <p class="mb-0"><strong>Total Amount:</strong> <span class="text-success fs-5">₹${order.totalAmount}</span></p>
            </div>
            <div class="col-md-6">
              <h6 class="text-muted text-uppercase small fw-bold mb-3">${user.role === "farmer" ? "Customer" : "Farmer"} Information</h6>
              <p class="mb-2"><strong>Name:</strong> ${user.role === "farmer" ? (order.consumerId?.name || "N/A") : (order.farmerId?.name || "N/A")}</p>
              <p class="mb-2"><strong>Contact:</strong> ${user.role === "farmer" ? (order.consumerId?.phone || "N/A") : (order.farmerId?.phone || "N/A")}</p>
              ${user.role === "farmer" && order.deliveryAddress ? `
                <p class="mb-2"><strong>Delivery Address:</strong></p>
                <p class="mb-0 small">${order.deliveryAddress.street}, ${order.deliveryAddress.city} - ${order.deliveryAddress.pincode}</p>
              ` : ""}
            </div>
          </div>

          <div class="order-progress mb-4">
            ${progressSteps}
          </div>

          <div class="mb-4">
            <h6 class="text-muted text-uppercase small fw-bold mb-3">Order Items</h6>
            <div class="table-responsive">
              <table class="table table-sm">
                <thead class="table-light">
                  <tr>
                    <th>Product</th>
                    <th>Quantity</th>
                    <th>Unit Price</th>
                    <th>Total</th>
                  </tr>
                </thead>
                <tbody>
                  ${order.products.map((item) => `
                    <tr>
                      <td>${item.productId?.name || "N/A"}</td>
                      <td>${item.quantity} ${item.productId?.unit || ""}</td>
                      <td>₹${item.price}</td>
                      <td><strong>₹${item.quantity * item.price}</strong></td>
                    </tr>
                  `).join("")}
                </tbody>
              </table>
            </div>
          </div>

          <div class="border-top pt-3">
            ${getActionButtonsFull(order, user.role)}
          </div>
        </div>
      `;

      document.getElementById("orderDetailsBody").innerHTML = modalContent;
      const modal = new bootstrap.Modal(document.getElementById("orderDetailsModal"));
      modal.show();

    } catch (error) {
      console.error("Error loading order details:", error);
      showToast(error.message || "Failed to load order details", "error");
    }
  };

  // Get full action buttons for modal
  function getActionButtonsFull(order, role) {
    if (role === "farmer") {
      if (order.status === "pending") {
        return `
          <button class="btn btn-success me-2" onclick="updateOrderStatus('${order._id}', 'confirmed'); bootstrap.Modal.getInstance(document.getElementById('orderDetailsModal')).hide();">
            <i class="fas fa-check me-1"></i>Confirm Order
          </button>
          <button class="btn btn-danger" onclick="updateOrderStatus('${order._id}', 'cancelled'); bootstrap.Modal.getInstance(document.getElementById('orderDetailsModal')).hide();">
            <i class="fas fa-times me-1"></i>Cancel Order
          </button>
        `;
      } else if (order.status === "confirmed") {
        return `
          <button class="btn btn-info text-white me-2" onclick="updateOrderStatus('${order._id}', 'out_for_delivery'); bootstrap.Modal.getInstance(document.getElementById('orderDetailsModal')).hide();">
            <i class="fas fa-truck me-1"></i>Mark Out for Delivery
          </button>
          <button class="btn btn-danger" onclick="updateOrderStatus('${order._id}', 'cancelled'); bootstrap.Modal.getInstance(document.getElementById('orderDetailsModal')).hide();">
            <i class="fas fa-times me-1"></i>Cancel Order
          </button>
        `;
      } else if (order.status === "out_for_delivery") {
        return `
          <button class="btn btn-success" onclick="updateOrderStatus('${order._id}', 'delivered'); bootstrap.Modal.getInstance(document.getElementById('orderDetailsModal')).hide();">
            <i class="fas fa-check-double me-1"></i>Mark as Delivered
          </button>
        `;
      }
    } else {
      if (order.status === "pending") {
        return `
          <button class="btn btn-outline-danger" onclick="cancelOrder('${order._id}'); bootstrap.Modal.getInstance(document.getElementById('orderDetailsModal')).hide();">
            <i class="fas fa-times me-1"></i>Cancel Order
          </button>
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
      if (user.role === "consumer") {
        updateFilterTabs();
      }
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
