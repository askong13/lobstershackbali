// --- STATE & INITIALIZATION ---

// Variabel global untuk menyimpan data produk setelah diambil pertama kali,
// ini mencegah pengambilan data berulang kali dari server.
let allProducts = null;

// Variabel untuk menyimpan isi keranjang, diambil dari Local Storage.
let cart = JSON.parse(localStorage.getItem('lobsterCart')) || [];

// Event listener utama yang berjalan saat dokumen HTML selesai dimuat.
document.addEventListener('DOMContentLoaded', () => {
    // Jalankan fungsi berdasarkan halaman yang sedang dibuka.
    routeBasedExecution();
    // Tambahkan event listener untuk semua interaksi klik di body.
    addGlobalEventListeners();
});

// --- ROUTING & PAGE-SPECIFIC LOGIC ---

/**
 * Menjalankan fungsi yang sesuai berdasarkan URL halaman saat ini.
 */
function routeBasedExecution() {
    const path = window.location.pathname;
    updateCartCount(); // Selalu update ikon keranjang di setiap halaman.

    if (path.endsWith('menu.html')) {
        renderFullMenu();
    } else if (path.endsWith('cart.html')) {
        renderCartPage();
    } else if (path.endsWith('index.html') || path === '/') {
        renderFeaturedMenu();
    }
}

// --- GLOBAL EVENT LISTENERS ---

/**
 * Menambahkan event listener ke `document.body` untuk menangani semua klik
 * secara efisien (event delegation).
 */
function addGlobalEventListeners() {
    document.body.addEventListener('click', async (e) => {
        const target = e.target;

        if (target.matches('.add-to-cart-btn')) {
            const productId = target.dataset.productId;
            handleAddToCart(productId);
        }

        if (target.matches('.btn-remove-from-cart')) {
            const index = parseInt(target.dataset.index, 10);
            removeFromCart(index);
        }
    });
}

// --- MENU & PRODUCT RENDERING ---

/**
 * Mengambil data produk dari API jika belum ada, lalu menyimpannya di variabel global.
 */
async function fetchProductsData() {
    if (allProducts) return allProducts; // Kembalikan data jika sudah ada.

    try {
        const response = await fetch('/api/get-products');
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        allProducts = await response.json();
        return allProducts;
    } catch (error) {
        console.error("Gagal mengambil data produk:", error);
        return null; // Kembalikan null jika gagal.
    }
}

/**
 * Fungsi utama untuk merender menu ke kontainer yang ditentukan.
 * @param {string} containerId - ID elemen kontainer.
 * @param {function} filterFunction - Fungsi untuk memfilter produk.
 */
async function fetchAndRenderMenu(containerId, filterFunction) {
    const menuContainer = document.getElementById(containerId);
    if (!menuContainer) return;

    menuContainer.innerHTML = '<p>Memuat menu...</p>';
    
    const products = await fetchProductsData();

    if (!products) {
        menuContainer.innerHTML = '<p>Gagal memuat menu. Silakan coba lagi nanti.</p>';
        return;
    }

    menuContainer.innerHTML = ''; // Kosongkan kontainer.
    
    const productsToRender = Object.keys(products).filter(key => filterFunction(products[key]));
    
    if (productsToRender.length === 0) {
        menuContainer.innerHTML = '<p>Tidak ada item menu yang tersedia.</p>';
        return;
    }

    productsToRender.forEach(key => {
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
    });
}

// Fungsi spesifik untuk merender menu unggulan di halaman utama.
function renderFeaturedMenu() {
    fetchAndRenderMenu('featured-menu-container', (product) => product.is_featured === true);
}

// Fungsi spesifik untuk merender semua menu di halaman menu.
function renderFullMenu() {
    fetchAndRenderMenu('full-menu-container', () => true);
}


// --- CART LOGIC ---

/**
 * Menambahkan item ke keranjang belanja.
 * @param {string} productId - ID produk yang akan ditambahkan.
 */
async function handleAddToCart(productId) {
    const products = await fetchProductsData();
    if (!products || !products[productId]) {
        alert("Gagal mendapatkan detail produk.");
        return;
    }
    
    const productToAdd = products[productId];
    
    const existingProduct = cart.find(item => item.productId === productId);
    if (existingProduct) {
        alert(`${productToAdd.name_en} sudah ada di keranjang!`);
    } else {
        cart.push({ ...productToAdd, productId });
        saveCart();
        alert(`${productToAdd.name_en} berhasil ditambahkan ke keranjang!`);
    }
}

/**
 * Menghapus item dari keranjang berdasarkan index array-nya.
 * @param {number} index - Index item yang akan dihapus.
 */
function removeFromCart(index) {
    cart.splice(index, 1);
    saveCart();
    renderCartPage(); // Render ulang halaman keranjang untuk menampilkan perubahan.
}

/**
 * Menyimpan data keranjang ke Local Storage dan memperbarui ikon hitung.
 */
function saveCart() {
    localStorage.setItem('lobsterCart', JSON.stringify(cart));
    updateCartCount();
}

/**
 * Mengupdate angka yang ditampilkan pada ikon keranjang.
 */
function updateCartCount() {
    const cartCountEl = document.getElementById('cart-count');
    if (cartCountEl) {
        cartCountEl.textContent = cart.length;
    }
}

/**
 * Merender semua item di keranjang ke halaman cart.html.
 */
function renderCartPage() {
    const container = document.getElementById('cart-items-container');
    const summary = document.getElementById('cart-summary');
    const totalEl = document.getElementById('cart-total');
    if (!container || !summary) return;

    if (cart.length === 0) {
        container.innerHTML = '<p>Keranjang Anda kosong.</p>';
        summary.classList.add('hidden');
        return;
    }

    container.innerHTML = '';
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
    
    totalEl.textContent = `Total: Rp ${totalPrice.toLocaleString('id-ID')}`;
    summary.classList.remove('hidden');
}
