/**
 * Renders the revenue chart using Chart.js
 * @param {Array} orders - List of orders
 */
function renderRevenueChart(orders) {
    const ctx = document.getElementById('revenueChart').getContext('2d');

    // Process data for the last 7 days
    const days = 7;
    const labels = [];
    const revenueData = [];

    for (let i = days - 1; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        labels.push(d.toLocaleDateString('en-US', { weekday: 'short' }));

        // Filter orders for this day and sum amount
        const dayStart = new Date(d.setHours(0, 0, 0, 0));
        const dayEnd = new Date(d.setHours(23, 59, 59, 999));

        const dayRevenue = orders.reduce((sum, order) => {
            const orderDate = new Date(order.createdAt);
            if (orderDate >= dayStart && orderDate <= dayEnd) {
                return sum + (parseFloat(order.totalAmount) || 0);
            }
            return sum;
        }, 0);

        revenueData.push(dayRevenue);
    }

    // Destroy existing chart if it exists
    if (window.myRevenueChart) {
        window.myRevenueChart.destroy();
    }

    window.myRevenueChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Revenue (₹)',
                data: revenueData,
                backgroundColor: 'rgba(46, 204, 113, 0.2)',
                borderColor: '#2ecc71',
                borderWidth: 2,
                tension: 0.4,
                fill: true,
                pointBackgroundColor: '#27ae60',
                pointRadius: 4,
                pointHoverRadius: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: function (context) {
                            return 'Revenue: ₹' + context.parsed.y;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: {
                        borderDash: [5, 5],
                        color: 'rgba(0, 0, 0, 0.05)'
                    },
                    ticks: {
                        callback: function (value) {
                            return '₹' + value;
                        }
                    }
                },
                x: {
                    grid: {
                        display: false
                    }
                }
            }
        }
    });
}
