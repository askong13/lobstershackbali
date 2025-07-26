import { initializeApp } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-app.js";
import { getDatabase, ref, onValue, get, set, push } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-database.js";
import { getAuth, onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-auth.js";

const firebaseConfig = { /* ... Konfigurasi Firebase Anda ... */ };
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const auth = getAuth(app);

// --- CART LOGIC ---
let cart = JSON.parse(localStorage.getItem('lobsterCart')) || [];

function saveCart() {
    localStorage.setItem('lobsterCart', JSON.stringify(cart));
    updateCartCount();
}

function addToCart(productId, product) {
    cart.push({ ...product, productId });
    saveCart();
    alert(`${product.name_en} added to cart!`);
}

function updateCartCount() {
    const cartCountEl = document.getElementById('cart-count');
    if (cartCountEl) cartCountEl.textContent = cart.length;
}

// --- AUTH LOGIC & UI UPDATE ---
onAuthStateChanged(auth, user => {
    const userAuthSection = document.getElementById('user-auth-section');
    if (!userAuthSection) return; // Hanya jalankan di halaman yang punya header

    const loginLink = document.getElementById('login-link');
    const userInfo = document.getElementById('user-info');
    const userNameEl = document.getElementById('user-name');
    const logoutLink = document.getElementById('logout-link');

    if (user) {
        // User is logged in
        loginLink.classList.add('hidden');
        userInfo.classList.remove('hidden');
        get(ref(db, `users/${user.uid}/profile/name`)).then(snapshot => {
            userNameEl.textContent = snapshot.val() || user.email;
        });
        logoutLink.onclick = (e) => { e.preventDefault(); signOut(auth); };
    } else {
        // User is logged out
        loginLink.classList.remove('hidden');
        userInfo.classList.add('hidden');
    }
});

// --- MAIN SCRIPT EXECUTION ---
document.addEventListener('DOMContentLoaded', () => {
    updateCartCount(); // Update cart count on every page load
    const path = window.location.pathname;

    if (path === '/' || path.endsWith('index.html')) {
        renderMenu('menu-grid-container', p => p.is_featured);
    }
    if (path.endsWith('login.html')) {
        handleLoginForm();
    }
    if (path.endsWith('register.html')) {
        handleRegisterForm();
    }
    if (path.endsWith('cart.html')) {
        displayCart();
    }
});

// --- PAGE-SPECIFIC FUNCTIONS ---

// LOGIN FORM
function handleLoginForm() {
    document.getElementById('login-form').addEventListener('submit', e => {
        e.preventDefault();
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;
        signInWithEmailAndPassword(auth, email, password)
            .then(() => window.location.href = '/')
            .catch(err => document.getElementById('form-error').textContent = err.message);
    });
}

// REGISTER FORM
function handleRegisterForm() {
    document.getElementById('register-form').addEventListener('submit', e => {
        e.preventDefault();
        const name = document.getElementById('reg-name').value;
        const email = document.getElementById('reg-email').value;
        const phone = document.getElementById('reg-phone').value;
        const address = document.getElementById('reg-address').value;
        const password = document.getElementById('reg-password').value;

        createUserWithEmailAndPassword(auth, email, password)
            .then(userCredential => {
                const user = userCredential.user;
                // Save user profile to Realtime Database
                set(ref(db, `users/${user.uid}/profile`), { name, phone, address });
                window.location.href = '/';
            })
            .catch(err => document.getElementById('form-error').textContent = err.message);
    });
}

// RENDER MENU
function renderMenu(containerId, filter) {
    const menuContainer = document.getElementById(containerId);
    if (!menuContainer) return;
    const productsRef = ref(db, 'products');
    
    get(productsRef).then((snapshot) => {
        if (snapshot.exists()) {
            menuContainer.innerHTML = '';
            const products = snapshot.val();
            for (const key in products) {
                const p = products[key];
                if (filter(p)) {
                    // ... (Kode render card seperti sebelumnya, tapi dengan 2 tombol)
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
            }
        }
    });

    // Event listeners untuk tombol di card
    menuContainer.addEventListener('click', e => {
        const target = e.target;
        if (target.classList.contains('add-to-cart-btn')) {
            const productId = target.dataset.productId;
            get(ref(db, `products/${productId}`)).then(snapshot => {
                if (snapshot.exists()) addToCart(productId, snapshot.val());
            });
        }
        if (target.classList.contains('order-now-btn')) {
            // Logika untuk order now modal akan ditambahkan di sini
            alert('Order now clicked!');
        }
    });
}

// DISPLAY CART
function displayCart() {
    const container = document.getElementById('cart-items-container');
    const summary = document.getElementById('cart-summary');
    if (cart.length === 0) {
        container.innerHTML = '<p>Keranjang Anda kosong.</p>';
        return;
    }
    
    container.innerHTML = '';
    let total = 0;
    cart.forEach(item => {
        total += item.price;
        container.innerHTML += `<div class="cart-item">
                                    <img src="${item.imageUrl}" alt="${item.name_en}">
                                    <div>
                                        <h3>${item.name_en}</h3>
                                        <p>Rp ${item.price.toLocaleString('id-ID')}</p>
                                    </div>
                               </div>`;
    });

    document.getElementById('cart-total').textContent = `Total: Rp ${total.toLocaleString('id-ID')}`;
    summary.classList.remove('hidden');
}

