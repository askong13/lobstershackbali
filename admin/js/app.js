// app.js
// Firebase config (USE YOUR ACTUAL ADMIN PANEL'S API KEY - it's okay if different from client)
const firebaseConfig = {
  apiKey: "AIzaSyCIC1WLirQbsY8XDsVhMWHVv8GO2nwcyjk",
  authDomain: "lobster-shack-bali.firebaseapp.com",
  databaseURL: "https://lobster-shack-bali-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "lobster-shack-bali",
  storageBucket: "lobster-shack-bali.firebasestorage.app",
  messagingSenderId: "42452974733",
  appId: "1:42452974733:web:5cad780f8295edd2b5f6c4"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const storage = firebase.storage(); // Initialize Firebase Storage

// Global utility functions
const showSpinner = () => { document.getElementById('loading-spinner').style.display = 'block'; };
const hideSpinner = () => { document.getElementById('loading-spinner').style.display = 'none'; };
const showToast = (message, type = 'info') => {
    const toast = document.getElementById('toast'); // Assuming a toast exists in index.html for admin
    const toastIcon = document.getElementById('toast-icon');
    const toastMessage = document.getElementById('toast-message');

    if (!toast) { console.warn("Toast element not found."); return; }

    toastMessage.textContent = message;
    toast.className = 'toast-notification'; // Reset classes
    toast.classList.add(type, 'show');

    const iconMap = { 'success': 'fa-check-circle', 'error': 'fa-times-circle', 'info': 'fa-info-circle' };
    toastIcon.className = `fas ${iconMap[type] || 'fa-info-circle'}`;

    setTimeout(() => { toast.classList.remove('show'); }, 4000);
};

// Routing and section loading
const sections = document.querySelectorAll('.section-content');
const navLinks = document.querySelectorAll('.nav-link');
const currentSectionTitle = document.getElementById('current-section-title');

const loadSection = (sectionId) => {
    showSpinner();
    sections.forEach(section => {
        section.style.display = 'none';
    });
    navLinks.forEach(link => {
        link.classList.remove('active');
    });

    const targetSection = document.getElementById(`${sectionId}-section`);
    const targetNavLink = document.querySelector(`[data-section="${sectionId}"]`);

    if (targetSection) {
        targetSection.style.display = 'block';
        currentSectionTitle.textContent = targetNavLink ? targetNavLink.textContent.trim() : sectionId.charAt(0).toUpperCase() + sectionId.slice(1);
        targetNavLink && targetNavLink.classList.add('active');

        // Call specific load functions for each section
        switch (sectionId) {
            case 'dashboard':
                loadDashboard();
                break;
            case 'orders':
                loadOrders();
                break;
            case 'products':
                loadProducts();
                break;
            case 'categories':
                loadCategories();
                break;
            case 'banners':
                loadBanners();
                break;
            case 'gallery':
                loadGallery();
                break;
            case 'history':
                loadHistory();
                break;
            case 'content':
                loadContent();
                break;
            default:
                break;
        }
    }
    hideSpinner();
};

window.addEventListener('hashchange', () => {
    const sectionId = window.location.hash.substring(1) || 'dashboard';
    if (firebase.auth().currentUser) { // Only load sections if authenticated
        loadSection(sectionId);
    }
});

// Initial load based on hash
document.addEventListener('DOMContentLoaded', () => {
    // Auth listener in auth.js will handle initial section load after checking auth state
    // Add toast notification element (if not already in index.html)
    if (!document.getElementById('toast')) {
        const toastDiv = document.createElement('div');
        toastDiv.id = 'toast';
        toastDiv.className = 'toast-notification';
        toastDiv.innerHTML = '<i id="toast-icon" class="fas fa-check-circle"></i><p id="toast-message">Notification</p>';
        document.body.appendChild(toastDiv);
    }
});
