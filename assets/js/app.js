import { initializeApp } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-app.js";
import { getDatabase, ref, onValue, get } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-database.js";

const firebaseConfig = { /* ... Konfigurasi Firebase Anda ... */ };
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// Inisialisasi Google Maps Autocomplete
window.initMap = function() {
  const addressInput = document.getElementById('delivery-address');
  if (addressInput) {
    const autocomplete = new google.maps.places.Autocomplete(addressInput, {
      componentRestrictions: { 'country': 'id' } // Batasi hanya untuk Indonesia
    });
  }
}

document.addEventListener('DOMContentLoaded', () => {
    // --- ANIMASI SAAT LOAD ---
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('is-visible');
            }
        });
    }, { threshold: 0.1 });
    document.querySelectorAll('.animate-on-scroll').forEach(el => observer.observe(el));

    // --- FUNGSI HALAMAN ---
    const path = window.location.pathname;
    if (path === '/' || path.endsWith('index.html')) {
        loadSlider();
        loadCompanyProfile();
        loadFeaturedMenu();
    }
    if (path.endsWith('menu.html')) {
        loadFullMenuAndModal();
    }
    
    // --- FUNGSI PEMUAT KONTEN ---
    function loadSlider() {
        const sliderContainer = document.getElementById('slider-container');
        const sliderRef = ref(db, 'siteContent/slider');
        onValue(sliderRef, (snapshot) => {
            if (snapshot.exists()) {
                sliderContainer.innerHTML = '';
                const slides = snapshot.val();
                for (const key in slides) {
                    const slide = slides[key];
                    const slideEl = document.createElement('div');
                    slideEl.className = 'swiper-slide';
                    slideEl.style.backgroundImage = `url(${slide.imageUrl})`;
                    slideEl.innerHTML = `<div class="slide-content"><h1>${slide.heading_en}</h1><p>${slide.subheading_en}</p></div>`;
                    sliderContainer.appendChild(slideEl);
                }
                // Inisialisasi Swiper setelah slide dimuat
                new Swiper('.swiper', { loop: true, pagination: { el: '.swiper-pagination' }, navigation: { nextEl: '.swiper-button-next', prevEl: '.swiper-button-prev' }, autoplay: { delay: 5000 } });
            }
        });
    }

    function loadCompanyProfile() {
        const profileRef = ref(db, 'siteContent/companyProfile');
        onValue(profileRef, (snapshot) => {
            const data = snapshot.val();
            if(data) {
                document.getElementById('profile-heading-en').textContent = data.heading_en;
                document.getElementById('profile-p1-en').textContent = data.paragraph1_en;
                document.getElementById('profile-p2-en').textContent = data.paragraph2_en;
            }
        });
    }

    function loadFeaturedMenu() { /* ... kode sama seperti sebelumnya ... */ }

    function loadFullMenuAndModal() {
        const menuContainer = document.getElementById('full-menu-container');
        if (!menuContainer) return;
        // 1. Load semua menu
        renderMenu('full-menu-container', () => true);

        // 2. Setup Modal
        const modal = document.getElementById('menu-modal');
        const closeBtn = modal.querySelector('.modal-close-btn');
        closeBtn.onclick = () => modal.classList.add('hidden');
        
        menuContainer.addEventListener('click', (e) => {
            const card = e.target.closest('.menu-card');
            if (card) {
                openModal(card.dataset.productId);
            }
        });
    }
    
    function openModal(productId) {
        const productRef = ref(db, `products/${productId}`);
        const modal = document.getElementById('menu-modal');
        get(productRef).then((snapshot) => {
            if(snapshot.exists()) {
                const data = snapshot.val();
                modal.querySelector('#modal-img').src = data.imageUrl;
                modal.querySelector('#modal-title').textContent = data.name_en;
                modal.querySelector('#modal-price').textContent = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(data.price);
                modal.querySelector('#modal-description').textContent = data.description_en;
                modal.classList.remove('hidden');
                // Panggil initMap lagi jika diperlukan untuk memastikan autocomplete aktif
                if (window.google) initMap(); 
            }
        });
    }

    function renderMenu(containerId, filter) { /* ... kode sama seperti sebelumnya, dengan 1 tambahan: ... */ 
        // Tambahkan baris ini di dalam loop `for (const key in products)`
        // card.dataset.productId = key;
    }
});
