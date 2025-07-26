document.addEventListener('DOMContentLoaded', () => {
    // Cek apakah ada token yang tersimpan
    const token = localStorage.getItem('adminToken');
    if (token) {
        showDashboard();
        fetchOrders(token);
    } else {
        showLoginPage();
    }

    // Tambahkan event listeners
    const loginForm = document.getElementById('admin-login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', handleAdminLogin);
    }

    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }
});

// UI-related functions
const showDashboard = () => {
    document.getElementById('admin-login-page').classList.add('hidden');
    document.getElementById('admin-dashboard').classList.remove('hidden');
};

const showLoginPage = () => {
    document.getElementById('admin-login-page').classList.remove('hidden');
    document.getElementById('admin-dashboard').classList.add('hidden');
};

async function handleAdminLogin(e) {
    e.preventDefault();
    const email = document.getElementById('admin-email').value;
    const password = document.getElementById('admin-password').value;
    const errorEl = document.getElementById('admin-login-error');

    try {
        const response = await fetch('/api/admin-login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
        });

        const result = await response.json();
        if (!response.ok) throw new Error(result.message);

        // Jika berhasil, simpan token ke local storage
        localStorage.setItem('adminToken', result.token);
        localStorage.setItem('adminEmail', email);

        // Tampilkan dashboard dan ambil data
        showDashboard();
        fetchOrders(result.token);

    } catch (error) {
        errorEl.textContent = error.message;
        errorEl.classList.remove('hidden');
    }
}

function handleLogout() {
    // Hapus token dan email dari local storage
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminEmail');
    // Tampilkan halaman login
    showLoginPage();
}

async function fetchOrders(token) {
    const ordersList = document.getElementById('orders-list');
    const userEmailEl = document.getElementById('admin-user-email');

    userEmailEl.textContent = localStorage.getItem('adminEmail') || '';
    ordersList.innerHTML = '<p>Mengambil data pesanan...</p>';

    try {
        const response = await fetch('/api/get-orders', {
            headers: {
                // Kirim token untuk otorisasi
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.status === 401 || response.status === 403) {
            // Jika token tidak valid atau expired
            handleLogout();
            return;
        }

        const orders = await response.json();

        // Render data pesanan ke dalam tabel
        renderOrdersTable(orders);

    } catch (error) {
        ordersList.innerHTML = `<p class="error">Gagal mengambil data pesanan.</p>`;
    }
}

function renderOrdersTable(orders) {
    const container = document.getElementById('orders-list');
    if (Object.keys(orders).length === 0) {
        container.innerHTML = '<p>Belum ada pesanan masuk.</p>';
        return;
    }

    let tableHTML = `<table class="orders-table">
        <thead>
            <tr>
                <th>Tanggal</th>
                <th>Email Pemesan</th>
                <th>Alamat</th>
                <th>Status</th>
            </tr>
        </thead>
        <tbody>`;

    // Urutkan pesanan dari yang terbaru
    const sortedOrders = Object.values(orders).sort((a, b) => b.timestamp - a.timestamp);

    sortedOrders.forEach(order => {
        tableHTML += `
            <tr>
                <td>${new Date(order.timestamp).toLocaleString('id-ID')}</td>
                <td>${order.userEmail || 'N/A'}</td>
                <td>${order.deliveryAddress || 'N/A'}</td>
                <td><span class="status-badge ${order.status}">${order.status}</span></td>
            </tr>
        `;
    });

    tableHTML += `</tbody></table>`;
    container.innerHTML = tableHTML;
}
