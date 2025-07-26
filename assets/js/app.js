// File ini aman untuk publik karena tidak ada kunci API.

document.addEventListener('DOMContentLoaded', () => {
    const path = window.location.pathname;

    // Menentukan fungsi mana yang akan dijalankan berdasarkan halaman
    if (path.endsWith('menu.html')) {
        renderFullMenu();
    } else { // Asumsikan halaman utama (index.html)
        renderFeaturedMenu();
    }

    updateCartCount();

    // Event listener global untuk tombol "Add to Cart"
    document.body.addEventListener('click', async (e) => {
        if (e.target && e.target.classList.contains('add-to-cart-btn')) {
            const productId = e.target.dataset.productId;
            // Kita perlu mengambil detail produk lagi untuk ditambahkan ke keranjang
            // Ini bisa dioptimalkan dengan menyimpan data produk di variabel global saat pertama kali fetch
            try {
                const response = await fetch('/api/get-products');
                const products = await response.json();
                if (products[productId]) {
                    addToCart(productId, products[productId]);
                }
            } catch (error) {
                console.error("Gagal menambahkan ke keranjang:", error);
                alert("Gagal menambahkan item ke keranjang.");
            }
        }
    });
});

/**
 * Mengambil data produk dari API serverless dan merendernya.
 * @param {string} containerId - ID elemen kontainer untuk menu.
 * @param {function} filterFunction - Fungsi untuk memfilter produk (e.g., hanya yang featured).
 */
async function fetchAndRenderMenu(containerId, filterFunction) {
    const menuContainer = document.getElementById(containerId);
    if (!menuContainer) return;

    menuContainer.innerHTML = '<p>Memuat menu...</p>';

    try {
        const response = await fetch('/api/get-products'); // Memanggil fungsi Netlify
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const products = await response.json();

        menuContainer.innerHTML = ''; // Kosongkan kontainer sebelum mengisi
        
        const productsToRender = Object.keys(products).filter(key => filterFunction(products[key]));
        
        if (productsToRender.length === 0) {
            menuContainer.innerHTML = '<p>Tidak ada item menu yang tersedia.</p>';
            return;
        }

        for (const key of productsToRender) {
            const p = products[key];
            const card = document.createElement('div');
            card.className = 'menu-card';
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
            menuContainer.appendChild(card);
        }
    } catch (error) {
        console.error("Gagal memuat menu:", error);
        menuContainer.innerHTML = '<p>Gagal memuat menu. Silakan coba lagi nanti.</p>';
    }
}

// Fungsi spesifik untuk merender menu unggulan di halaman utama
function renderFeaturedMenu() {
    fetchAndRenderMenu('featured-menu-container', (product) => product.is_featured === true);
}

// Fungsi spesifik untuk merender semua menu di halaman menu
function renderFullMenu() {
    fetchAndRenderMenu('full-menu-container', () => true); // 'true' berarti semua produk akan lolos filter
}


// --- LOGIKA KERANJANG (CART) ---
// Bagian ini tidak berubah karena hanya berinteraksi dengan Local Storage di browser

let cart = JSON.parse(localStorage.getItem('lobsterCart')) || [];

function saveCart() {
    localStorage.setItem('lobsterCart', JSON.stringify(cart));
    updateCartCount();
}

function addToCart(productId, product) {
    // Cek apakah produk sudah ada di keranjang
    const existingProduct = cart.find(item => item.productId === productId);
    if (existingProduct) {
        // Jika sudah ada, mungkin Anda ingin menambah jumlahnya (implementasi selanjutnya)
        alert(`${product.name_en} sudah ada di keranjang!`);
    } else {
        cart.push({ ...product, productId });
        saveCart();
        alert(`${product.name_en} berhasil ditambahkan ke keranjang!`);
    }
}

function updateCartCount() {
    const cartCountEl = document.getElementById('cart-count');
    if (cartCountEl) {
        cartCountEl.textContent = cart.length;
    }
}


// ... (kode app.js yang sudah ada sebelumnya) ...

/**
 * Merender konten untuk halaman keranjang belanja (cart.html).
 */
function renderCartPage() {
    const container = document.getElementById('cart-items-container');
    const summary = document.getElementById('cart-summary');
    const totalEl = document.getElementById('cart-total');
    if (!container || !summary) return;

    // Ambil data keranjang dari local storage
    const cart = JSON.parse(localStorage.getItem('lobsterCart')) || [];

    if (cart.length === 0) {
        container.innerHTML = '<p>Keranjang Anda kosong.</p>';
        summary.classList.add('hidden');
        return;
    }

    container.innerHTML = ''; // Kosongkan sebelum mengisi
    let totalPrice = 0;

    cart.forEach((item, index) => {
        const itemEl = document.createElement('div');
        itemEl.className = 'cart-item';
        itemEl.innerHTML = `
            <img src="${item.imageUrl}" alt="${item.name_en}">
            <div class="cart-item-info">
                <h4>${item.name_en}</h4>
                <p>Rp ${item.price.toLocaleString('id-ID')}</p>
            </div>
            <button class="btn-remove-from-cart" data-index="${index}">Hapus</button>
        `;
        container.appendChild(itemEl);
        totalPrice += item.price;
    });
    
    // Tampilkan total dan tombol checkout
    totalEl.textContent = `Total: Rp ${totalPrice.toLocaleString('id-ID')}`;
    summary.classList.remove('hidden');

    // Tambahkan event listener untuk tombol hapus
    container.querySelectorAll('.btn-remove-from-cart').forEach(button => {
        button.addEventListener('click', (e) => {
            const indexToRemove = parseInt(e.target.dataset.index, 10);
            removeFromCart(indexToRemove);
        });
    });
}

/**
 * Menghapus item dari keranjang berdasarkan index-nya.
 * @param {number} index - Index item yang akan dihapus.
 */
function removeFromCart(index) {
    let cart = JSON.parse(localStorage.getItem('lobsterCart')) || [];
    cart.splice(index, 1); // Hapus 1 item pada index yang diberikan
    localStorage.setItem('lobsterCart', JSON.stringify(cart));
    updateCartCount(); // Update angka di header
    renderCartPage();  // Render ulang halaman keranjang
}

// Pastikan fungsi updateCartCount ada dan berfungsi
function updateCartCount() {
    const cart = JSON.parse(localStorage.getItem('lobsterCart')) || [];
    const cartCountEl = document.getElementById('cart-count');
    if (cartCountEl) {
        cartCountEl.textContent = cart.length;
    }
}
