// admin/js/dashboard.js
const dashboardSection = document.getElementById('dashboard-section');

async function loadDashboard() {
    showSpinner();
    dashboardSection.innerHTML = `
        <h2>Dashboard Overview</h2>
        <div class="dashboard-stats" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; margin-top: 20px;">
            <div class="stat-card" style="background-color: #e0f2f7; padding: 20px; border-radius: 8px; box-shadow: var(--shadow-sm);">
                <h3 style="color: var(--secondary-color); margin-bottom: 10px;">Total Orders</h3>
                <p style="font-size: 2.5rem; font-weight: 700; color: var(--primary-color);" id="total-orders-count">0</p>
            </div>
            <div class="stat-card" style="background-color: #e6f9ed; padding: 20px; border-radius: 8px; box-shadow: var(--shadow-sm);">
                <h3 style="color: var(--secondary-color); margin-bottom: 10px;">Total Products</h3>
                <p style="font-size: 2.5rem; font-weight: 700; color: var(--primary-color);" id="total-products-count">0</p>
            </div>
            <div class="stat-card" style="background-color: #fff3e0; padding: 20px; border-radius: 8px; box-shadow: var(--shadow-sm);">
                <h3 style="color: var(--secondary-color); margin-bottom: 10px;">New Orders (Today)</h3>
                <p style="font-size: 2.5rem; font-weight: 700; color: var(--primary-color);" id="new-orders-count">0</p>
            </div>
        </div>

        <div class="recent-orders" style="margin-top: 30px;">
            <h2>Recent Orders</h2>
            <div class="table-responsive">
                <table class="admin-table">
                    <thead>
                        <tr>
                            <th>Order ID</th>
                            <th>Customer Name</th>
                            <th>Total Amount</th>
                            <th>Status</th>
                            <th>Date</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody id="recent-orders-table-body">
                        <tr><td colspan="6" style="text-align: center;">Loading recent orders...</td></tr>
                    </tbody>
                </table>
            </div>
        </div>
    `;

    const totalOrdersCount = document.getElementById('total-orders-count');
    const totalProductsCount = document.getElementById('total-products-count');
    const newOrdersCount = document.getElementById('new-orders-count');
    const recentOrdersTableBody = document.getElementById('recent-orders-table-body');

    try {
        // Fetch total orders
        const ordersSnapshot = await db.collection('orders').get();
        totalOrdersCount.textContent = ordersSnapshot.size;

        // Fetch total products
        const productsSnapshot = await db.collection('products').get();
        totalProductsCount.textContent = productsSnapshot.size;

        // Fetch new orders today
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(today.getDate() + 1);

        const newOrdersSnapshot = await db.collection('orders')
            .where('timestamp', '>=', today)
            .where('timestamp', '<', tomorrow)
            .get();
        newOrdersCount.textContent = newOrdersSnapshot.size;

        // Fetch recent orders (e.g., last 5)
        const recentOrdersSnapshot = await db.collection('orders')
            .orderBy('timestamp', 'desc')
            .limit(5)
            .get();

        recentOrdersTableBody.innerHTML = '';
        if (recentOrdersSnapshot.empty) {
            recentOrdersTableBody.innerHTML = `<tr><td colspan="6" style="text-align: center;">No recent orders.</td></tr>`;
        } else {
            recentOrdersSnapshot.docs.forEach(doc => {
                const order = doc.data();
                const orderDate = order.timestamp ? new Date(order.timestamp.seconds * 1000).toLocaleString() : 'N/A';
                const row = recentOrdersTableBody.insertRow();
                row.innerHTML = `
                    <td>${doc.id.substring(0, 6)}...</td>
                    <td>${order.customerName}</td>
                    <td>Rp ${new Intl.NumberFormat('id-ID').format(order.totalAmount)}</td>
                    <td><span class="status-${order.status}">${order.status.toUpperCase()}</span></td>
                    <td>${orderDate}</td>
                    <td>
                        <button class="btn btn-info view-order-btn" data-id="${doc.id}"><i class="fas fa-eye"></i> View</button>
                    </td>
                `;
            });
        }

        // Add event listener for view order buttons (delegated)
        recentOrdersTableBody.addEventListener('click', (e) => {
            const viewBtn = e.target.closest('.view-order-btn');
            if (viewBtn) {
                const orderId = viewBtn.dataset.id;
                // Use the viewOrderDetails function from orders.js
                if (typeof viewOrderDetails === 'function') {
                    viewOrderDetails(orderId);
                } else {
                    console.warn("viewOrderDetails function not found. Ensure orders.js is loaded correctly.");
                }
            }
        });

    } catch (error) {
        console.error("Error loading dashboard data:", error);
        showToast("Failed to load dashboard data.", 'error');
    } finally {
        hideSpinner();
    }
}
