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

        // Add Dashboard link for Farmers
        if (user.role === 'farmer') {
            const dashboardLi = document.createElement('li');
            dashboardLi.className = 'nav-item';
            dashboardLi.innerHTML = `
                <a class="nav-link" href="farmer-dashboard.html">
                    <i class="fas fa-chart-line me-1"></i> Dashboard
                </a>
            `;
            // Insert before Logout or at the end
            navbarNav.insertBefore(dashboardLi, navbarNav.firstChild);
        }

        // Add Logout Link/Button
        const logoutLi = document.createElement('li');
        logoutLi.className = 'nav-item dropdown ms-2';
        logoutLi.innerHTML = `
            <a class="nav-link dropdown-toggle" href="#" id="navbarDropdown" role="button" data-bs-toggle="dropdown" aria-expanded="false">
                <i class="fas fa-user-circle me-1"></i> ${user.name}
            </a>
            <ul class="dropdown-menu dropdown-menu-end" aria-labelledby="navbarDropdown">
                ${user.role === 'farmer' ? '<li><a class="dropdown-item" href="farmer-dashboard.html">Dashboard</a></li>' : '<li><a class="dropdown-item" href="orders.html">My Orders</a></li>'}
                <li><hr class="dropdown-divider"></li>
                <li><a class="dropdown-item" href="#" id="logoutLink">Logout</a></li>
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
