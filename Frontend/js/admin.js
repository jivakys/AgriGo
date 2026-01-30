/* Admin Dashboard Controller */
document.addEventListener('DOMContentLoaded', () => {

    // --- Mock Data ---
    const users = [
        { id: '#1234', name: 'John Doe', email: 'john@example.com', role: 'Consumer', location: 'New York, USA' },
        { id: '#1235', name: 'Green Farms', email: 'contact@greenfarms.com', role: 'Farmer', location: 'California, US' },
        { id: '#1236', name: 'Alice Smith', email: 'alice@test.com', role: 'Consumer', location: 'London, UK' },
        { id: '#1237', name: 'Fresh Valley', email: 'info@freshvalley.com', role: 'Farmer', location: 'Idaho, US' },
    ];

    const products = [
        { id: 'P001', name: 'Organic Tomatoes', category: 'Vegetables', price: 5.99, stock: 120, image: 'https://via.placeholder.com/40' },
        { id: 'P002', name: 'Fresh Milk', category: 'Dairy', price: 3.50, stock: 50, image: 'https://via.placeholder.com/40' },
        { id: 'P003', name: 'Red Apples', category: 'Fruits', price: 12.00, stock: 200, image: 'https://via.placeholder.com/40' },
        { id: 'P004', name: 'Carrots', category: 'Vegetables', price: 2.99, stock: 80, image: 'https://via.placeholder.com/40' },
    ];

    const orders = [
        { id: '#2734', name: 'Brooklyn Zoe', address: 'Danyor', date: '03/03/23', price: 72.0, status: 'Pending' },
        { id: '#2735', name: 'Jhon haider', address: 'Gilgit', date: '03/05/23', price: 62.0, status: 'Dispatch' },
        { id: '#1334', name: 'Zoe nee', address: 'Skardu', date: '03/07/23', price: 52.0, status: 'Complete' },
        { id: '#3454', name: 'Clack max', address: 'Roundu', date: '03/08/23', price: 42.0, status: 'Complete' },
        { id: '#1454', name: 'Vernie Hart', address: 'Tallu', date: '03/10/23', price: 32.0, status: 'Pending' },
        { id: '#2746', name: 'jonsan', address: 'Danyor', date: '03/12/23', price: 22.0, status: 'Dispatch' },
    ];

    // --- State Management ---
    let currentView = 'dashboard';

    // --- Rendering Functions ---

    function renderDashboardOrders() {
        const tbody = document.getElementById('dashboardOrdersTable');
        if (!tbody) return;

        tbody.innerHTML = orders.slice(0, 5).map(order => `
            <tr>
                <td>${order.id}</td>
                <td><div class="user-cell"><img src="https://ui-avatars.com/api/?name=${order.name}&background=random" alt=""> ${order.name}</div></td>
                <td>Product Name</td> <!-- Placeholder -->
                <td>${order.date}</td>
                <td><span class="status-badge ${order.status.toLowerCase()}">${order.status}</span></td>
                <td>$${order.price}</td>
            </tr>
        `).join('');
    }

    function renderOrders(filter = 'all') {
        const tbody = document.getElementById('ordersTableBody');
        if (!tbody) return;

        let filteredOrders = orders;
        if (filter !== 'all') {
            filteredOrders = orders.filter(o => o.status.toLowerCase() === filter.toLowerCase());
        }

        tbody.innerHTML = filteredOrders.map(order => `
            <tr>
                <td>${order.id}</td>
                <td><div class="user-cell"><img src="https://ui-avatars.com/api/?name=${order.name}&background=random" alt=""> ${order.name}</div></td>
                <td>${order.address}</td>
                <td>${order.date}</td>
                <td>$${order.price}</td>
                <td><span class="status-badge ${order.status.toLowerCase()}">${order.status}</span></td>
                <td>
                    <button class="btn btn-sm btn-outline-primary"><i class="fas fa-cog"></i></button>
                    <button class="btn btn-sm btn-outline-secondary"><i class="fas fa-chevron-down"></i></button>
                </td>
            </tr>
        `).join('');
    }

    function renderProducts() {
        const tbody = document.getElementById('productsTableBody');
        if (!tbody) return;

        tbody.innerHTML = products.map(product => `
            <tr>
                <td>${product.id}</td>
                <td><img src="${product.image}" alt="${product.name}" style="width: 40px; border-radius: 4px;"></td>
                <td>${product.name}</td>
                <td><span class="badge bg-secondary">${product.category}</span></td>
                <td>$${product.price}</td>
                <td>${product.stock}</td>
                <td>
                    <button class="btn btn-sm btn-light text-primary"><i class="fas fa-edit"></i></button>
                    <button class="btn btn-sm btn-light text-danger"><i class="fas fa-trash"></i></button>
                </td>
            </tr>
        `).join('');
    }

    function renderUsers() {
        const tbody = document.getElementById('usersTableBody');
        if (!tbody) return;

        tbody.innerHTML = users.map(user => `
             <tr>
                <td>${user.id}</td>
                <td><div class="user-cell"><img src="https://ui-avatars.com/api/?name=${user.name}&background=random" alt=""> ${user.name}</div></td>
                <td>${user.email}</td>
                <td><span class="badge ${user.role === 'Farmer' ? 'bg-success' : 'bg-primary'}">${user.role}</span></td>
                <td>${user.location}</td>
                 <td>
                    <button class="btn btn-sm btn-light text-primary"><i class="fas fa-edit"></i></button>
                    <button class="btn btn-sm btn-light text-danger"><i class="fas fa-trash"></i></button>
                </td>
            </tr>
        `).join('');
    }

    // --- Navigation Logic ---
    const menuItems = document.querySelectorAll('.menu-item[data-target]');
    const views = document.querySelectorAll('.admin-view');
    const pageTitle = document.getElementById('pageTitle');

    function switchView(targetId) {
        // Update Sidebar
        menuItems.forEach(item => item.classList.remove('active'));
        document.querySelector(`.menu-item[data-target="${targetId}"]`).classList.add('active');

        // Update View
        views.forEach(view => view.classList.remove('active'));
        document.getElementById(`view-${targetId}`).classList.add('active');

        // Update Title
        pageTitle.textContent = targetId.charAt(0).toUpperCase() + targetId.slice(1);

        currentView = targetId;

        // Trigger Render
        if (targetId === 'orders') renderOrders();
        if (targetId === 'products') renderProducts();
        if (targetId === 'users') renderUsers();
        if (targetId === 'dashboard') renderDashboardOrders();
    }

    menuItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const target = item.getAttribute('data-target');
            switchView(target);
        });
    });

    // --- Filter Tabs Logic (Orders) ---
    const filterTabs = document.querySelectorAll('.filter-tab');
    filterTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            filterTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            renderOrders(tab.getAttribute('data-filter'));
        });
    });

    // --- Modal Logic Binding ---
    window.openAddProductModal = () => {
        const modal = new bootstrap.Modal(document.getElementById('addProductModal'));
        modal.show();
    };

    window.openAddUserModal = () => {
        const modal = new bootstrap.Modal(document.getElementById('addUserModal'));
        modal.show();
    };

    const addProductForm = document.getElementById('addProductForm');
    if (addProductForm) {
        addProductForm.addEventListener('submit', (e) => {
            e.preventDefault();
            // In a real app, send API request here
            const formData = new FormData(addProductForm);
            // Simulate Add
            products.unshift({
                id: 'P' + Date.now().toString().slice(-3),
                name: formData.get('name'),
                category: formData.get('category'),
                price: formData.get('price'),
                stock: formData.get('stock'),
                image: 'https://via.placeholder.com/40'
            });
            renderProducts();
            bootstrap.Modal.getInstance(document.getElementById('addProductModal')).hide();
            addProductForm.reset();
            Toastify({ text: "Product added successfully", backgroundColor: "green" }).showToast();
        });
    }

    const addUserForm = document.getElementById('addUserForm');
    if (addUserForm) {
        addUserForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const formData = new FormData(addUserForm);
            users.unshift({
                id: '#' + Date.now().toString().slice(-4),
                name: formData.get('name'),
                email: formData.get('email'),
                role: formData.get('role').charAt(0).toUpperCase() + formData.get('role').slice(1),
                location: formData.get('location')
            });
            renderUsers();
            bootstrap.Modal.getInstance(document.getElementById('addUserModal')).hide();
            addUserForm.reset();
            Toastify({ text: "User added successfully", backgroundColor: "green" }).showToast();
        });
    }

    // --- Logout ---
    document.getElementById('logoutBtn').addEventListener('click', () => {
        // Clear tokens etc
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = 'index.html';
    });

    // --- Init ---
    renderDashboardOrders();

});
