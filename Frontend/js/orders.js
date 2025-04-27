// Order Management Functions
document.addEventListener("DOMContentLoaded", function () {
  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user"));

  // Check authentication
  if (!token) {
    window.location.href = "login.html";
    return;
  }

  // Load orders based on user role
  async function loadOrders() {
    try {
      const endpoint =
        user.role === "farmer" ? "/orders/farmer" : "/orders/consumer";
      const response = await fetch(endpoint, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to load orders");
      }

      const orders = await response.json();
      displayOrders(orders);
    } catch (error) {
      console.error("Error loading orders:", error);
      alert("Failed to load orders");
    }
  }

  // Display orders in the UI
  function displayOrders(orders) {
    const ordersContainer = document.getElementById("ordersContainer");
    if (!ordersContainer) return;

    ordersContainer.innerHTML = orders
      .map(
        (order) => `
            <div class="card mb-3">
                <div class="card-header">
                    Order #${order._id}
                    <span class="badge bg-${getStatusBadgeClass(
                      order.status
                    )} float-end">
                        ${order.status}
                    </span>
                </div>
                <div class="card-body">
                    <div class="row">
                        <div class="col-md-6">
                            <h5>Order Details</h5>
                            <p><strong>Date:</strong> ${new Date(
                              order.createdAt
                            ).toLocaleDateString()}</p>
                            <p><strong>Total Amount:</strong> ₹${
                              order.totalAmount
                            }</p>
                        </div>
                        <div class="col-md-6">
                            <h5>${
                              user.role === "farmer" ? "Consumer" : "Farmer"
                            } Details</h5>
                            <p><strong>Name:</strong> ${
                              user.role === "farmer"
                                ? order.consumer.name
                                : order.farmer.name
                            }</p>
                            <p><strong>Contact:</strong> ${
                              user.role === "farmer"
                                ? order.consumer.phone
                                : order.farmer.phone
                            }</p>
                        </div>
                    </div>
                    <div class="mt-3">
                        <h5>Products</h5>
                        <div class="table-responsive">
                            <table class="table">
                                <thead>
                                    <tr>
                                        <th>Product</th>
                                        <th>Quantity</th>
                                        <th>Price</th>
                                        <th>Total</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${order.items
                                      .map(
                                        (item) => `
                                        <tr>
                                            <td>${item.product.name}</td>
                                            <td>${item.quantity} ${
                                          item.product.unit
                                        }</td>
                                            <td>₹${item.product.price}</td>
                                            <td>₹${
                                              item.quantity * item.product.price
                                            }</td>
                                        </tr>
                                    `
                                      )
                                      .join("")}
                                </tbody>
                            </table>
                        </div>
                    </div>
                    ${
                      user.role === "farmer"
                        ? `
                        <div class="mt-3">
                            <button class="btn btn-success" onclick="updateOrderStatus('${order._id}', 'completed')">
                                Mark as Completed
                            </button>
                            <button class="btn btn-danger" onclick="updateOrderStatus('${order._id}', 'cancelled')">
                                Cancel Order
                            </button>
                        </div>
                    `
                        : ""
                    }
                </div>
            </div>
        `
      )
      .join("");
  }

  // Update order status
  window.updateOrderStatus = async function (orderId, status) {
    try {
      const response = await fetch(`/orders/${orderId}/status`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status }),
      });

      if (!response.ok) {
        throw new Error("Failed to update order status");
      }

      alert("Order status updated successfully!");
      loadOrders(); // Refresh orders list
    } catch (error) {
      console.error("Error updating order status:", error);
      alert("Failed to update order status");
    }
  };

  // Helper function for status badge styling
  function getStatusBadgeClass(status) {
    switch (status.toLowerCase()) {
      case "pending":
        return "warning";
      case "completed":
        return "success";
      case "cancelled":
        return "danger";
      default:
        return "secondary";
    }
  }

  // Initialize order listing
  loadOrders();
});
