/**
 * Handles navigation bar state based on user authentication
 */
document.addEventListener('DOMContentLoaded', function () {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');

    // Only proceed if we have a navbar to update
    const navbarNav = document.querySelector('#navbarNav .navbar-nav.ms-auto');
    if (!navbarNav) return;

    if (token && userStr) {
        const user = JSON.parse(userStr);

        // Remove "Login" link
        const loginLink = Array.from(navbarNav.querySelectorAll('.nav-link'))
            .find(link => link.getAttribute('href') === 'login.html');
        if (loginLink) {
            loginLink.parentElement.remove();
        }

        // Add role-specific navigation
        if (user.role === 'farmer') {
            // Add Dashboard link for Farmers
            const dashboardLi = document.createElement('li');
            dashboardLi.className = 'nav-item';
            dashboardLi.innerHTML = `
                <a class="nav-link" href="farmer-dashboard.html">
                    <i class="fas fa-chart-line me-1"></i> Dashboard
                </a>
            `;
            navbarNav.insertBefore(dashboardLi, navbarNav.firstChild);
        } else if (user.role === 'consumer') {
            // Ensure consumer has proper navigation links
            // Check if Cart link exists, if not add it
            const cartLink = Array.from(navbarNav.querySelectorAll('.nav-link'))
                .find(link => link.getAttribute('href') === 'cart.html');

            if (!cartLink) {
                const cartLi = document.createElement('li');
                cartLi.className = 'nav-item';
                cartLi.innerHTML = `
                    <a class="nav-link" href="cart.html">
                        <i class="fas fa-shopping-cart me-1"></i> Cart
                    </a>
                `;

                // Insert Cart before Orders or at the end
                const ordersLink = Array.from(navbarNav.querySelectorAll('.nav-link'))
                    .find(link => link.getAttribute('href') === 'orders.html');
                if (ordersLink) {
                    navbarNav.insertBefore(cartLi, ordersLink.parentElement);
                } else {
                    navbarNav.appendChild(cartLi);
                }
            }
        }

        // Add Logout Link/Button with user dropdown
        const logoutLi = document.createElement('li');
        logoutLi.className = 'nav-item dropdown ms-2';
        logoutLi.innerHTML = `
            <a class="nav-link dropdown-toggle" href="#" id="navbarDropdown" role="button" data-bs-toggle="dropdown" aria-expanded="false">
                <i class="fas fa-user-circle me-1"></i> ${user.name}
            </a>
            <ul class="dropdown-menu dropdown-menu-end" aria-labelledby="navbarDropdown">
                ${user.role === 'farmer'
                ? '<li><a class="dropdown-item" href="farmer-dashboard.html"><i class="fas fa-chart-line me-2"></i>Dashboard</a></li>'
                : '<li><a class="dropdown-item" href="buyer-info.html"><i class="fas fa-home me-2"></i>Home</a></li><li><a class="dropdown-item" href="orders.html"><i class="fas fa-box me-2"></i>My Orders</a></li>'}
                <li><hr class="dropdown-divider"></li>
                <li><a class="dropdown-item" href="#" id="logoutLink"><i class="fas fa-sign-out-alt me-2"></i>Logout</a></li>
            </ul>
        `;
        navbarNav.appendChild(logoutLi);

        // Handle Logout
        document.getElementById('logoutLink').addEventListener('click', function (e) {
            e.preventDefault();
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = 'index.html';
        });
    }
});
