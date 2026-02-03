document.addEventListener("DOMContentLoaded", () => {
  // Check if user is logged in and is an admin
  const user = JSON.parse(localStorage.getItem("user"));
  const token = localStorage.getItem("token");

  if (!token || !user || user.role !== "admin") {
    window.location.href = "login.html";
    return;
  }

  const API_BASE_URL = "http://localhost:3000";

  // --- State Management ---
  let users = [];
  let products = [];
  let orders = [];
  let currentView = "dashboard";

  // --- Data Fetching ---
  async function fetchStats() {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/stats`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();

      // Update Stat Cards
      document.querySelector(".stat-card:nth-child(1) h3").textContent =
        data.totalOrders;
      // Assuming Active Users is same as Total for now, or use what API returned
      document.querySelector(".stat-card:nth-child(2) h3").textContent =
        data.activeUsers || data.totalUsers;
      document.querySelector(".stat-card:nth-child(3) h3").textContent =
        data.totalProducts;
      document.querySelector(".stat-card:nth-child(4) h3").textContent =
        "$" + (data.totalRevenue || 0).toLocaleString();
    } catch (error) {
      console.error("Error fetching stats:", error);
      Toastify({
        text: "Failed to load stats",
        backgroundColor: "red",
      }).showToast();
    }
  }

  async function fetchUsers() {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/users`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      users = await response.json();
      renderUsers();
    } catch (error) {
      console.error("Error fetching users:", error);
      Toastify({
        text: "Failed to load users",
        backgroundColor: "red",
      }).showToast();
    }
  }

  async function fetchProducts() {
    try {
      const response = await fetch(`${API_BASE_URL}/products`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      products = await response.json();
      renderProducts();
    } catch (error) {
      console.error("Error fetching products:", error);
      Toastify({
        text: "Failed to load products",
        backgroundColor: "red",
      }).showToast();
    }
  }

  async function fetchOrders() {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/orders`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      orders = await response.json();
      renderOrders();
      renderDashboardOrders(); // Also update dashboard recent orders
    } catch (error) {
      console.error("Error fetching orders:", error);
      Toastify({
        text: "Failed to load orders",
        backgroundColor: "red",
      }).showToast();
    }
  }

  // --- Rendering Functions ---

  function renderDashboardOrders() {
    const tbody = document.getElementById("dashboardOrdersTable");
    if (!tbody) return;

    // Show top 5 recent orders
    const recentOrders = orders.slice(0, 5);

    tbody.innerHTML = recentOrders
      .map(
        (order) => `
            <tr>
                <td>#${order._id.slice(-6)}</td>
                <td><div class="user-cell"><img src="https://ui-avatars.com/api/?name=${order.consumerId?.name || "User"}&background=random" alt=""> ${order.consumerId?.name || "Unknown"}</div></td>
                <td>${order.products.length} Items</td>
                <td>${new Date(order.createdAt).toLocaleDateString()}</td>
                <td><span class="status-badge ${order.status.toLowerCase()}">${order.status}</span></td>
                <td>$${order.totalAmount}</td>
            </tr>
        `,
      )
      .join("");
  }

  function renderOrders(filter = "all") {
    const tbody = document.getElementById("ordersTableBody");
    if (!tbody) return;

    let filteredOrders = orders;
    if (filter !== "all") {
      filteredOrders = orders.filter(
        (o) => o.status.toLowerCase() === filter.toLowerCase(),
      );
    }

    tbody.innerHTML = filteredOrders
      .map(
        (order) => `
            <tr>
                <td>#${order._id.slice(-6)}</td>
                <td><div class="user-cell"><img src="https://ui-avatars.com/api/?name=${order.consumerId?.name || "User"}&background=random" alt=""> ${order.consumerId?.name || "Unknown"}</div></td>
                <td>${order.deliveryAddress ? order.deliveryAddress.street + ", " + order.deliveryAddress.city : "N/A"}</td>
                <td>${new Date(order.createdAt).toLocaleDateString()}</td>
                <td>$${order.totalAmount}</td>
                <td><span class="status-badge ${order.status.toLowerCase()}">${order.status}</span></td>
                <td>
                    <button class="btn btn-sm btn-outline-primary"><i class="fas fa-cog"></i></button>
                    <!-- <button class="btn btn-sm btn-outline-secondary"><i class="fas fa-chevron-down"></i></button> -->
                </td>
            </tr>
        `,
      )
      .join("");
  }

  function renderProducts() {
    const tbody = document.getElementById("productsTableBody");
    if (!tbody) return;

    tbody.innerHTML = products
      .map(
        (product) => `
            <tr>
                <td>#${product._id.slice(-6)}</td>
                <td><img src="${product.images && product.images.length > 0 ? product.images[0] : "https://via.placeholder.com/40"}" alt="${product.name}" style="width: 40px; border-radius: 4px;"></td>
                <td>${product.name}</td>
                <td><span class="badge bg-secondary">${product.category}</span></td>
                <td>$${product.price}</td>
                <td>${product.quantity} ${product.unit}</td>
                <td>
                    <button class="btn btn-sm btn-light text-primary"><i class="fas fa-edit"></i></button>
                    <button class="btn btn-sm btn-light text-danger"><i class="fas fa-trash"></i></button>
                </td>
            </tr>
        `,
      )
      .join("");
  }

  function renderUsers() {
    const tbody = document.getElementById("usersTableBody");
    if (!tbody) return;

    tbody.innerHTML = users
      .map(
        (u) => `
             <tr>
                <td>#${u._id.slice(-6)}</td>
                <td><div class="user-cell"><img src="https://ui-avatars.com/api/?name=${u.name}&background=random" alt=""> ${u.name}</div></td>
                <td>${u.email}</td>
                <td><span class="badge ${u.role === "farmer" ? "bg-success" : "bg-primary"}">${u.role}</span></td>
                <td>${u.farmInfo?.farmLocation || u.phone || "N/A"}</td>
                 <td>
                    <button class="btn btn-sm btn-light text-primary"><i class="fas fa-edit"></i></button>
                    <button class="btn btn-sm btn-light text-danger"><i class="fas fa-trash"></i></button>
                </td>
            </tr>
        `,
      )
      .join("");
  }

  // --- Navigation Logic ---
  const menuItems = document.querySelectorAll(".menu-item[data-target]");
  const views = document.querySelectorAll(".admin-view");
  const pageTitle = document.getElementById("pageTitle");

  function switchView(targetId) {
    // Update Sidebar
    menuItems.forEach((item) => item.classList.remove("active"));
    document
      .querySelector(`.menu-item[data-target="${targetId}"]`)
      .classList.add("active");

    // Update View
    views.forEach((view) => view.classList.remove("active"));
    document.getElementById(`view-${targetId}`).classList.add("active");

    // Update Title
    pageTitle.textContent =
      targetId.charAt(0).toUpperCase() + targetId.slice(1);

    currentView = targetId;

    // Trigger Data Fetch
    if (targetId === "dashboard") {
      fetchStats();
      fetchOrders(); // Refresh recent orders
    }
    if (targetId === "orders") fetchOrders();
    if (targetId === "products") fetchProducts();
    if (targetId === "users") fetchUsers();
  }

  menuItems.forEach((item) => {
    item.addEventListener("click", (e) => {
      e.preventDefault();
      const target = item.getAttribute("data-target");
      switchView(target);
    });
  });

  // --- Filter Tabs Logic (Orders) ---
  const filterTabs = document.querySelectorAll(".filter-tab");
  filterTabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      filterTabs.forEach((t) => t.classList.remove("active"));
      tab.classList.add("active");
      renderOrders(tab.getAttribute("data-filter"));
    });
  });

  // --- Modal Logic Binding ---
  window.openAddProductModal = () => {
    const modal = new bootstrap.Modal(
      document.getElementById("addProductModal"),
    );
    modal.show();
  };

  window.openAddUserModal = () => {
    const modal = new bootstrap.Modal(document.getElementById("addUserModal"));
    modal.show();
  };

  // Note: Add forms are just UI simulation or need proper API integration.
  // For now leaving them as they were but without mock array push (which won't persist).
  // In a real scenario, you'd add fetch calls to POST /users and POST /products here.

  const addProductForm = document.getElementById("addProductForm");
  if (addProductForm) {
    addProductForm.addEventListener("submit", (e) => {
      e.preventDefault();
      Toastify({
        text: "Add Product functionality requires backend implementation for Admin",
        backgroundColor: "orange",
      }).showToast();
      bootstrap.Modal.getInstance(
        document.getElementById("addProductModal"),
      ).hide();
    });
  }

  const addUserForm = document.getElementById("addUserForm");
  if (addUserForm) {
    addUserForm.addEventListener("submit", (e) => {
      e.preventDefault();
      Toastify({
        text: "Add User functionality requires backend implementation for Admin",
        backgroundColor: "orange",
      }).showToast();
      bootstrap.Modal.getInstance(
        document.getElementById("addUserModal"),
      ).hide();
    });
  }

  // --- Logout ---
  document.getElementById("logoutBtn").addEventListener("click", () => {
    // Clear tokens etc
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "index.html";
  });

  // --- Init ---
  // Start with dashboard data
  fetchStats();
  fetchOrders(); // Get orders for "Recent Orders" table
});
