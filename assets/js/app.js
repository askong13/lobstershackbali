// File ini AMAN untuk berada di browser.

// --- GLOBAL STATE & UTILITIES ---
let cart = JSON.parse(localStorage.getItem('lobsterCart')) || [];
const API_BASE_URL = '/api'; // Menggunakan proxy dari netlify.toml

// --- FUNGSI UTAMA ---
document.addEventListener('DOMContentLoaded', () => {
    // Jalankan fungsi berdasarkan halaman yang sedang dibuka
    const path = window.location.pathname;

    if (path === '/' || path.endsWith('index.html')) {
        loadHomePage();
    }
    if (path.endsWith('menu.html')) {
        loadMenuPage();
    }
    // Tambahkan event listener untuk form login, register, dll.
});

// --- FUNGSI UNTUK MEMUAT DATA HALAMAN ---

async function loadHomePage() {
    const menuContainer = document.getElementById('menu-grid-container'); // Ganti dengan ID yang sesuai
    if (!menuContainer) return;

    try {
        // Panggil fungsi serverless, bukan Firebase secara langsung
        const response = await fetch(`${API_BASE_URL}/get-products`);
        if (!response.ok) throw new Error('Gagal memuat data menu.');

        const products = await response.json();
        renderMenu(menuContainer, products, p => p.is_featured); // Kirim data produk ke fungsi render

    } catch (error) {
        console.error("Error:", error);
        menuContainer.innerHTML = `<p>Gagal memuat menu. Silakan coba lagi nanti.</p>`;
    }
}

// Buat fungsi serupa untuk halaman lain, misal: loadMenuPage()

// --- FUNGSI RENDER ---
function renderMenu(container, products, filterFunction) {
    container.innerHTML = ''; // Kosongkan kontainer
    for (const key in products) {
        if (filterFunction(products[key])) {
            const p = products[key];
            const card = document.createElement('div');
            card.className = 'menu-card';
            // Perhatikan: Gunakan data 'p' yang sudah diterima dari server
            card.innerHTML = `
                <img src="${p.imageUrl}" alt="${p.name_en}">
                <div class="menu-card-content">
                    <h3>${p.name_en}</h3>
                    <p class="menu-card-price">Rp ${p.price.toLocaleString('id-ID')}</p>
                    <p>${p.description_en}</p>
                    <div class="card-buttons">
                        <button class="btn secondary add-to-cart-btn" data-product-id="${key}">Add to Cart</button>
                        <button class="btn order-now-btn" data-product-id="${key}">Order Now</button>
                    </div>
                </div>`;
            container.appendChild(card);
        }
    }
    // Tambahkan event listener untuk tombol 'Add to Cart' di sini
}

// --- LOGIKA KERANJANG (CART) ---
// Logika keranjang tidak perlu banyak berubah karena hanya berinteraksi dengan localStorage
function addToCart(productId, product) {
    // ... implementasi sama seperti sebelumnya ...
}
function updateCartCount() {
    // ... implementasi sama seperti sebelumnya ...
}
