// admin/js/orders.js
const ordersSection = document.getElementById('orders-section');
let orderModal; // Will be defined when loadOrders is called
let currentOrderId = null; // To keep track of the order being viewed/edited

async function loadOrders() {
    showSpinner();
    ordersSection.innerHTML = `
        <h2>Order Management</h2>
        <div class="filters" style="margin-bottom: 20px;">
            <label for="order-status-filter">Filter by Status:</label>
            <select id="order-status-filter" style="padding: 8px; border-radius: 5px; border: 1px solid var(--border-color);">
                <option value="all">All</option>
                <option value="new">New</option>
                <option value="processing">Processing</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
            </select>
        </div>
        <div class="table-responsive">
            <table class="admin-table">
                <thead>
                    <tr>
                        <th>Order ID</th>
                        <th>Customer Name</th>
                        <th>Total Amount</th>
                        <th>Status</th>
                        <th>Order Date</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody id="orders-table-body">
                    <tr><td colspan="6" style="text-align: center;">Loading orders...</td></tr>
                </tbody>
            </table>
        </div>

        <div id="order-details-modal" class="modal-overlay order-details-modal" style="display: none;">
            <div class="modal-content">
                <div class="modal-header">
                    <h3>Order Details (<span id="modal-order-id"></span>)</h3>
                    <button class="modal-close-btn">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="order-summary">
                        <p><strong>Customer Name:</strong> <span id="modal-customer-name"></span></p>
                        <p><strong>Phone:</strong> <span id="modal-customer-phone"></span></p>
                        <p><strong>Address:</strong> <span id="modal-customer-address"></span></p>
                        <p><strong>Order Date:</strong> <span id="modal-order-date"></span></p>
                        <p><strong>Subtotal:</strong> <span id="modal-order-subtotal"></span></p>
                        <p><strong>Delivery Fee:</strong> <span id="modal-order-delivery-fee"></span></p>
                        <p style="font-size: 1.2rem; font-weight: bold;"><strong>Total Amount:</strong> <span id="modal-order-total-amount"></span></p>
                        <p><strong>Current Status:</strong> <span id="modal-order-status-text"></span></p>
                    </div>

                    <div class="order-items">
                        <h4>Items:</h4>
                        <div class="table-responsive">
                            <table class="admin-table">
                                <thead>
                                    <tr>
                                        <th>Item</th>
                                        <th>Quantity</th>
                                        <th>Price</th>
                                        <th>Subtotal</th>
                                    </tr>
                                </thead>
                                <tbody id="modal-order-items-body">
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div class="form-group">
                        <label for="order-status-update">Update Status:</label>
                        <select id="order-status-update" class="order-status-select">
                            <option value="new">New</option>
                            <option value="processing">Processing</option>
                            <option value="completed">Completed</option>
                            <option value="cancelled">Cancelled</option>
                        </select>
                        <button id="update-order-status-btn" class="btn btn-primary" style="margin-left: 10px;">Update Status</button>
                    </div>
                </div>
            </div>
        </div>
    `;

    const ordersTableBody = document.getElementById('orders-table-body');
    const orderStatusFilter = document.getElementById('order-status-filter');
    orderModal = document.getElementById('order-details-modal');
    const modalCloseBtn = orderModal.querySelector('.modal-close-btn');
    const updateOrderStatusBtn = document.getElementById('update-order-status-btn');
    const orderStatusUpdateSelect = document.getElementById('order-status-update');

    // Listener for filter change
    orderStatusFilter.addEventListener('change', () => {
        renderOrders(orderStatusFilter.value);
    });

    // Initial render of orders
    renderOrders('all');

    // Close Modal event listeners
    modalCloseBtn.addEventListener('click', () => {
        hideModal(orderModal);
    });
    orderModal.addEventListener('click', (e) => {
        if (e.target === orderModal) {
            hideModal(orderModal);
        }
    });

    // Update order status button click
    updateOrderStatusBtn.addEventListener('click', async () => {
        if (!currentOrderId) return;
        const newStatus = orderStatusUpdateSelect.value;
        showSpinner();
        try {
            await db.collection('orders').doc(currentOrderId).update({ status: newStatus });
            showToast(`Order ${currentOrderId.substring(0, 6)}... status updated to ${newStatus.toUpperCase()}.`, 'success');
            hideModal(orderModal);
            renderOrders(orderStatusFilter.value); // Re-render orders to show updated status
        } catch (error) {
            console.error("Error updating order status:", error);
            showToast("Failed to update order status.", 'error');
        } finally {
            hideSpinner();
        }
    });
}

async function renderOrders(filterStatus) {
    showSpinner();
    const ordersTableBody = document.getElementById('orders-table-body');
    ordersTableBody.innerHTML = `<tr><td colspan="6" style="text-align: center;">Loading orders...</td></tr>`;

    let query = db.collection('orders').orderBy('timestamp', 'desc');
    if (filterStatus !== 'all') {
        query = query.where('status', '==', filterStatus);
    }

    try {
        const snapshot = await query.get();
        ordersTableBody.innerHTML = '';
        if (snapshot.empty) {
            ordersTableBody.innerHTML = `<tr><td colspan="6" style="text-align: center;">No orders found for this status.</td></tr>`;
        } else {
            snapshot.docs.forEach(doc => {
                const order = doc.data();
                const orderDate = order.timestamp ? new Date(order.timestamp.seconds * 1000).toLocaleString() : 'N/A';
                const row = ordersTableBody.insertRow();
                row.innerHTML = `
                    <td>${doc.id.substring(0, 8)}...</td>
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
        ordersTableBody.querySelectorAll('.view-order-btn').forEach(btn => {
            btn.removeEventListener('click', handleViewOrderClick); // Remove old listener to prevent duplicates
            btn.addEventListener('click', handleViewOrderClick);
        });

    } catch (error) {
        console.error("Error fetching orders:", error);
        showToast("Failed to load orders.", 'error');
    } finally {
        hideSpinner();
    }
}

async function handleViewOrderClick(e) {
    const orderId = e.target.closest('button')?.dataset.id;
    if (orderId) {
        viewOrderDetails(orderId);
    }
}

// Global function to be called from dashboard.js
window.viewOrderDetails = async (orderId) => {
    showSpinner();
    currentOrderId = orderId;
    try {
        const orderDoc = await db.collection('orders').doc(orderId).get();
        if (orderDoc.exists) {
            const order = orderDoc.data();
            document.getElementById('modal-order-id').textContent = orderId.substring(0, 8);
            document.getElementById('modal-customer-name').textContent = order.customerName;
            document.getElementById('modal-customer-phone').textContent = order.customerPhone;
            document.getElementById('modal-customer-address').textContent = order.customerAddress;
            document.getElementById('modal-order-date').textContent = order.timestamp ? new Date(order.timestamp.seconds * 1000).toLocaleString() : 'N/A';
            document.getElementById('modal-order-subtotal').textContent = `Rp ${new Intl.NumberFormat('id-ID').format(order.subtotal)}`;
            document.getElementById('modal-order-delivery-fee').textContent = `Rp ${new Intl.NumberFormat('id-ID').format(order.deliveryFee)}`;
            document.getElementById('modal-order-total-amount').textContent = `Rp ${new Intl.NumberFormat('id-ID').format(order.totalAmount)}`;
            document.getElementById('modal-order-status-text').textContent = order.status.toUpperCase();
            document.getElementById('order-status-update').value = order.status;

            const modalOrderItemsBody = document.getElementById('modal-order-items-body');
            modalOrderItemsBody.innerHTML = '';
            order.orderDetails.forEach(item => {
                const row = modalOrderItemsBody.insertRow();
                row.innerHTML = `
                    <td>${item.name}</td>
                    <td>${item.quantity}</td>
                    <td>Rp ${new Intl.NumberFormat('id-ID').format(item.price)}</td>
                    <td>Rp ${new Intl.NumberFormat('id-ID').format(item.price * item.quantity)}</td>
                `;
            });
            showModal(orderModal);
        } else {
            showToast("Order not found!", 'error');
        }
    } catch (error) {
        console.error("Error fetching order details:", error);
        showToast("Failed to load order details.", 'error');
    } finally {
        hideSpinner();
    }
};
