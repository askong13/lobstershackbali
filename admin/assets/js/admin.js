'use strict';

// Global variables
let currentLanguage = localStorage.getItem('preferredLanguage') || 'id';
let siteData = {};
let lightbox;
let db; // Firebase database instance

// DOM Elements
const domElements = {
    body: document.body,
    mainNav: document.getElementById('ls-main-nav'),
    mobileMenuToggle: document.getElementById('ls-mobile-menu-toggle'),
    langToggleContainer: document.querySelector('.ls-language-toggle'),
    heroSliderWrapper: document.getElementById('ls-hero-slider-wrapper'),
    // REVISED: New container for the About Us article
    aboutUsArticle: document.getElementById('ls-about-us-article'), 
    featuredMenuWrapper: document.getElementById('ls-featured-menu-wrapper'),
    menuGrid: document.getElementById('ls-menu-grid'),
    menuFilters: document.getElementById('ls-menu-filters'),
    galleryGrid: document.getElementById('ls-gallery-grid'),
    modalOverlay: document.getElementById('ls-product-modal-overlay'),
    modalBody: document.getElementById('ls-modal-body'),
    modalCloseBtn: document.getElementById('ls-modal-close-btn'),
    cookieConsent: document.getElementById('ls-cookie-consent'),
    cookieAcceptBtn: document.getElementById('ls-cookie-accept-btn'),
};

// --- CORE FUNCTIONS ---
const updateTextContent = () => {
    document.querySelectorAll('[data-lang-key]').forEach(el => {
        const key = el.dataset.langKey;
        const content = siteData.content?.[key];
        if (content) {
            // Use innerText for most elements to avoid re-rendering icons, but innerHTML for specific ones if needed.
            const target = el.querySelector('span') || el;
            target.innerHTML = content[`text_${currentLanguage}`] || content.text_id || target.innerHTML;
        }
    });
    document.title = siteData.content?.ls_page_title?.[`text_${currentLanguage}`] || 'Lobster Shack Bali';
    updateLangButtons();
};

const updateLangButtons = () => {
    document.querySelectorAll('.ls-lang-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.lang === currentLanguage);
    });
};

// --- RENDER FUNCTIONS ---
const renderBanners = () => {
    if (!siteData.banners || siteData.banners.length === 0 || !domElements.heroSliderWrapper) return;
    domElements.heroSliderWrapper.innerHTML = siteData.banners.map(banner => `
        <div class="swiper-slide">
            <div class="ls-slide-background" style="background-image: url('${banner.image_url}');"></div>
            <div class="ls-slide-overlay"></div>
        </div>`).join('');
    new Swiper('.ls-hero-slider', {
        loop: true, effect: 'fade', fadeEffect: { crossFade: true },
        autoplay: { delay: 5000, disableOnInteraction: false },
        pagination: { el: '.swiper-pagination', clickable: true },
        allowTouchMove: false
    });
};

// --- REVISED renderHistory function ---
const renderHistory = () => {
    // This function now renders a single article, not a timeline.
    if (!domElements.aboutUsArticle) return; // Exit if the new container doesn't exist

    // The "history" collection is now used for the single About Us article.
    // We'll take the first document found in the collection.
    const aboutArticleData = siteData.history && siteData.history.length > 0 ? siteData.history[0] : null;

    if (aboutArticleData) {
        domElements.aboutUsArticle.innerHTML = `
            <img src="https://lh3.googleusercontent.com/d/1GIdbd0F7kn0O4L8qEr-25GXSEWbLNVj9" alt="Lobster Shack Bali" class="about-logo">
            <h3>${aboutArticleData[`title_${currentLanguage}`] || aboutArticleData.title_id}</h3>
            <p>${aboutArticleData[`text_${currentLanguage}`] || aboutArticleData.text_id}</p>
        `;
    } else {
        domElements.aboutUsArticle.innerHTML = '<p>Our story is being written. Please check back soon!</p>';
    }
};


const renderMenu = () => {
    if (!siteData.products || !siteData.categories || !domElements.menuGrid) return;
    
    const getCardHTML = p => `
        <div class="ls-menu-card" data-category="${p.category_name}" data-product-id="${p.id}"> 
            <div class="ls-menu-card-image"><img src="${p.imageUrl}" alt="${p.name_en}" loading="lazy"></div> 
            <div class="ls-menu-card-content"> 
                <div class="title-price">
                    <h3>${p[`name_${currentLanguage}`] || p.name_id}</h3>
                    <span class="ls-menu-card-price">Rp ${new Intl.NumberFormat('id-ID').format(p.price)}</span>
                </div>
                <p class="ls-description">${(p[`description_${currentLanguage}`] || p.description_id)}</p>
                <div class="ls-card-actions">
                    <button class="ls-btn ls-view-details-btn"><i class="fas fa-eye"></i> <span data-lang-key="view_details_btn">View Details</span></button>
                    ${p.gofood_link ? `<a href="${p.gofood_link}" target="_blank" rel="noopener noreferrer" class="ls-order-link" aria-label="Order on GoFood"><img src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRF4G3lRAltCydaksfc29WU0fH7mJrnweaDYLqBrCw33Vxb6QfzKD87ANo&s=10" alt="GoFood Logo" style="width:24px; height:24px;"></a>` : ''}
                    ${p.grabfood_link ? `<a href="${p.grabfood_link}" target="_blank" rel="noopener noreferrer" class="ls-order-link" aria-label="Order on GrabFood"><img src="https://iconlogovector.com/uploads/images/2023/11/lg-655d63568932b-grab-food.png" alt="GrabFood Logo" style="width:24px; height:24px;"></a>` : ''}
                </div>
            </div> 
        </div>`;
    
    if(domElements.featuredMenuWrapper) {
        domElements.featuredMenuWrapper.innerHTML = siteData.products
            .filter(p => p.is_featured).map(p => `<div class="swiper-slide">${getCardHTML(p)}</div>`).join('');
    }
        
    domElements.menuGrid.innerHTML = siteData.products.map(p => getCardHTML(p)).join('');
    
    const allText = currentLanguage === 'id' ? 'Semua' : 'All';
    if(domElements.menuFilters) {
        domElements.menuFilters.innerHTML = `<button class="ls-filter-btn active" data-filter="all">${allText}</button>` +
            siteData.categories.map(c => `<button class="ls-filter-btn" data-filter="${c.name}">${c.name}</button>`).join('');
    }
    
    new Swiper('.ls-featured-slider', { 
        slidesPerView: 1, spaceBetween: 24, grabCursor: true, 
        pagination: { el: '.swiper-pagination', clickable: true },
        breakpoints: { 576: { slidesPerView: 2 }, 992: { slidesPerView: 3 } }
    });
};

const renderGallery = () => {
    if (!siteData.gallery_images || !domElements.galleryGrid) return;
    domElements.galleryGrid.innerHTML = siteData.gallery_images.map(img => `
        <a href="${img.image_url}" class="glightbox" data-gallery="our-gallery" data-title="${img[`caption_${currentLanguage}`] || img.caption_id}"> 
            <img src="${img.image_url}" alt="${img.caption_en || 'Gallery Image'}" loading="lazy"> 
        </a>`).join('');
    if (lightbox) { 
        lightbox.reload(); 
    } else { 
        lightbox = GLightbox({ selector: '.glightbox', touchNavigation: true }); 
    }
};

const showProductModal = (productId) => {
    const product = siteData.products.find(p => p.id === productId);
    if (!product || !domElements.modalOverlay) return;
    domElements.modalBody.innerHTML = `
        <div class="modal-image">
            <img src="${product.imageUrl}" alt="${product.name_en}">
        </div>
        <div class="modal-text">
            <h3>${product[`name_${currentLanguage}`] || product.name_id}</h3>
            <span class="modal-price">Rp ${new Intl.NumberFormat('id-ID').format(product.price)}</span>
            <p class="modal-description">${product[`description_${currentLanguage}`] || product.description_id}</p>
        </div>`;
    domElements.body.classList.add('ls-modal-open');
    domElements.modalOverlay.classList.add('visible');
};

const hideProductModal = () => {
    if (!domElements.modalOverlay) return;
    domElements.body.classList.remove('ls-modal-open');
    domElements.modalOverlay.classList.remove('visible');
};

const renderAll = () => {
    renderBanners();
    renderHistory();
    renderMenu();
    renderGallery();
    updateTextContent();
    AOS.init({ duration: 800, once: true, offset: 50 });
};

// --- DATA FETCHING ---
async function fetchAllData() {
    try {
        const collections = ['products', 'categories', 'content', 'banners', 'gallery_images', 'history'];
        const promises = collections.map(col => db.collection(col).get());
        const [ productsSnap, categoriesSnap, contentSnap, bannersSnap, gallerySnap, historySnap ] = await Promise.all(promises);
        
        siteData.products = productsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        siteData.categories = categoriesSnap.docs.map(doc => doc.data()).sort((a,b) => a.id - b.id);
        siteData.banners = bannersSnap.docs.map(doc => doc.data()).sort((a,b) => a.sort_order - b.sort_order);
        siteData.gallery_images = gallerySnap.docs.map(doc => doc.data()).sort((a,b) => a.sort_order - b.sort_order);
        siteData.history = historySnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        siteData.content = {};
        contentSnap.docs.forEach(doc => { siteData.content[doc.id] = doc.data(); });
        
        renderAll();
        setupFloatingButton(); // This is called from floating.js
    } catch (error) {
        console.error("Error fetching data from Firebase:", error);
        if (document.body) document.body.innerHTML = "<h1>Error loading site data. Please try again later.</h1>";
    }
}

// --- COOKIE CONSENT LOGIC ---
const handleCookieConsent = () => {
    if (!domElements.cookieConsent || document.cookie.split(';').some((item) => item.trim().startsWith('ls_cookie_consent='))) {
        return;
    }
    domElements.cookieConsent.classList.add('active');
};

// --- EVENT LISTENERS ---
function addAllEventListeners() {
    if (domElements.langToggleContainer) {
        domElements.langToggleContainer.addEventListener('click', e => {
            if (!e.target.matches('.ls-lang-btn') || e.target.classList.contains('active')) return;
            currentLanguage = e.target.dataset.lang;
            localStorage.setItem('preferredLanguage', currentLanguage);
            // Re-render content that depends on language
            renderHistory(); 
            renderMenu(); 
            renderGallery(); 
            updateTextContent();
        });
    }
    
    if (domElements.mobileMenuToggle) {
        domElements.mobileMenuToggle.addEventListener('click', () => {
            domElements.mainNav.classList.toggle('active');
            domElements.body.classList.toggle('ls-nav-open');
            const icon = domElements.mobileMenuToggle.querySelector('i');
            icon.classList.toggle('fa-bars'); 
            icon.classList.toggle('fa-times');
        });
    }

    if (domElements.mainNav) {
        domElements.mainNav.addEventListener('click', (e) => {
            if (e.target.matches('a') && domElements.mainNav.classList.contains('active')) {
                domElements.mobileMenuToggle.click();
            }
        });
    }
    
    if (domElements.menuFilters) {
        domElements.menuFilters.addEventListener('click', e => {
            if (!e.target.matches('.ls-filter-btn') || e.target.classList.contains('active')) return;
            domElements.menuFilters.querySelector('.active').classList.remove('active');
            e.target.classList.add('active');
            const filter = e.target.dataset.filter;
            domElements.menuGrid.querySelectorAll('.ls-menu-card').forEach(card => {
                const isVisible = filter === 'all' || card.dataset.category === filter;
                card.classList.toggle('hidden', !isVisible);
            });
        });
    }

    if (domElements.body) {
        domElements.body.addEventListener('click', e => {
            const detailsButton = e.target.closest('.ls-view-details-btn');
            if (detailsButton) {
                const card = detailsButton.closest('.ls-menu-card');
                if (card) showProductModal(card.dataset.productId);
            }
        });
    }

    if(domElements.modalCloseBtn) domElements.modalCloseBtn.addEventListener('click', hideProductModal);
    if(domElements.modalOverlay) domElements.modalOverlay.addEventListener('click', e => {
        if (e.target === domElements.modalOverlay) hideProductModal();
    });
    
    if (domElements.cookieAcceptBtn) {
        domElements.cookieAcceptBtn.addEventListener('click', () => {
            let d = new Date();
            d.setTime(d.getTime() + (365 * 24 * 60 * 60 * 1000));
            let expires = "expires=" + d.toUTCString();
            document.cookie = "ls_cookie_consent=accepted;" + expires + ";path=/";
            domElements.cookieConsent.classList.remove('active');
        });
    }

    const sections = document.querySelectorAll('main > section[id]');
    const navLinks = document.querySelectorAll('.ls-nav-links a');
    window.addEventListener('scroll', () => {
        let current = '';
        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            if (window.pageYOffset >= sectionTop - 150) {
                current = section.getAttribute('id');
            }
        });
        navLinks.forEach(a => {
            a.classList.remove('active');
            if (a.getAttribute('href').includes(current)) {
                a.classList.add('active');
            }
        });
    }, { passive: true });
}

// --- APP INITIALIZATION ---
async function initApp() {
    try {
        const firebaseConfig = {
            apiKey: "AIzaSyCIC1WLirQbsY8XDsVhMWHVv8GO2nwcyjk",
            authDomain: "lobster-shack-bali.firebaseapp.com",
            projectId: "lobster-shack-bali",
            storageBucket: "lobster-shack-bali.appspot.com",
            messagingSenderId: "42452974733",
            appId: "1:42452974733:web:5cad780f8295edd2b5f6c4"
        };

        firebase.initializeApp(firebaseConfig);
        db = firebase.firestore();

        addAllEventListeners();
        await fetchAllData();
        setTimeout(handleCookieConsent, 2000);

    } catch (error) {
        console.error("Failed to initialize app:", error);
        document.body.innerHTML = `<h1>Error initializing application.</h1><p>Could not load configuration. Please contact support.</p>`;
    }
}

document.addEventListener('DOMContentLoaded', initApp);
