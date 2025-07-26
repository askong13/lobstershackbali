import { initializeApp } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-app.js";
import { getDatabase, ref, onValue, get, push } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-database.js";

// KONFIGURASI FIREBASE ANDA - SUDAH TERINTEGRASI
const firebaseConfig = {
  apiKey: "AIzaSyCIC1WLirQbsY8XDsVhMWHVv8GO2nwcyjk",
  authDomain: "lobster-shack-bali.firebaseapp.com",
  databaseURL: "https://lobster-shack-bali-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "lobster-shack-bali",
  storageBucket: "lobster-shack-bali.firebasestorage.app",
  messagingSenderId: "42452974733",
  appId: "1:42452974733:web:5cad780f8295edd2b5f6c4"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

document.addEventListener('DOMContentLoaded', () => {
    // --- PENGATUR BAHASA ---
    const langIdBtn = document.getElementById('lang-id');
    const langEnBtn = document.getElementById('lang-en');
    const setLanguage = (lang) => {
        localStorage.setItem('preferredLanguage', lang);
        if (langIdBtn) langIdBtn.classList.toggle('active', lang === 'id');
        if (langEnBtn) langEnBtn.classList.toggle('active', lang === 'en');
        document.querySelectorAll('[id$="-id"], [id$="-en"]').forEach(el => el.classList.add('hidden'));
        document.querySelectorAll(`[id$="-${lang}"]`).forEach(el => el.classList.remove('hidden'));
        document.documentElement.lang = lang;
    };
    const initialLang = localStorage.getItem('preferredLanguage') || (navigator.language.startsWith('id') ? 'id' : 'en');
    setLanguage(initialLang);
    if(langIdBtn) langIdBtn.addEventListener('click', (e) => { e.preventDefault(); setLanguage('id'); });
    if(langEnBtn) langEnBtn.addEventListener('click', (e) => { e.preventDefault(); setLanguage('en'); });
    
    // --- LOGIKA HALAMAN ---
    const path = window.location.pathname;

    // Logika untuk index.html
    if (path === '/' || path.endsWith('index.html')) {
        loadSiteContent();
        loadFeaturedMenu();
    }
    // Logika untuk menu.html
    if (path.endsWith('menu.html')) {
        loadFullMenu();
    }
    // Logika untuk reservation.html
    if (path.endsWith('reservation.html')) {
        handleReservationForm();
    }

    // --- FUNGSI-FUNGSI ---
    function loadSiteContent() {
        const siteContentRef = ref(db, 'siteContent');
        onValue(siteContentRef, (snapshot) => {
            const content = snapshot.val();
            if (content) {
                document.getElementById('hero-title-id').textContent = content.hero_title_id || "";
                document.getElementById('hero-title-en').textContent = content.hero_title_en || "";
            }
        });
    }

    function renderMenu(containerId, filter) {
        const menuContainer = document.getElementById(containerId);
        if (!menuContainer) return;

        const productsRef = ref(db, 'products');
        get(productsRef).then((snapshot) => {
            if (snapshot.exists()) {
                menuContainer.innerHTML = '';
                const products = snapshot.val();
                for (const key in products) {
                    const product = products[key];
                    if (filter(product)) {
                        const priceIDR = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(product.price);
                        const card = document.createElement('div');
                        card.className = 'menu-card';
                        card.innerHTML = `<img src="${product.imageUrl || 'https://via.placeholder.com/400x250'}" alt="${product.name_en}">
                                          <div class="menu-card-content">
                                            <h3>${product.name_en}</h3>
                                            <p class="menu-card-price">${priceIDR}</p>
                                            <p>${product.description_en}</p>
                                          </div>`;
                        menuContainer.appendChild(card);
                    }
                }
            } else {
                menuContainer.innerHTML = '<p>Menu tidak tersedia saat ini.</p>';
            }
        });
    }

    function loadFeaturedMenu() {
        renderMenu('menu-grid-container', (product) => product.is_featured);
    }
    
    function loadFullMenu() {
        renderMenu('full-menu-container', () => true); // Tampilkan semua produk
    }

    function handleReservationForm() {
        const form = document.getElementById('reservation-form');
        const messageContainer = document.getElementById('form-message-container');
        if (!form) return;

        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const reservationData = {
                name: form.name.value,
                email: form.email.value,
                phone: form.phone.value,
                date: form.date.value,
                time: form.time.value,
                guests: form.guests.value,
                status: 'pending',
                createdAt: new Date().toISOString()
            };
            
            push(ref(db, 'reservations'), reservationData)
                .then(() => {
                    form.reset();
                    messageContainer.innerHTML = `<div class="form-message success">Reservasi Anda telah dikirim! Kami akan segera mengonfirmasi melalui email.</div>`;
                })
                .catch((error) => {
                    messageContainer.innerHTML = `<div class="form-message error">Terjadi kesalahan. Silakan coba lagi. Error: ${error.message}</div>`;
                });
        });
    }

    // --- FOOTER ---
    const yearSpan = document.getElementById('current-year');
    if(yearSpan) yearSpan.textContent = new Date().getFullYear();
});
export { db };
