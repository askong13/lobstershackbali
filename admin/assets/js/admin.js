'use strict';

// --- Global variables ---
let auth, db, storage;
let productsData = [], categoriesData = [], contentData = [], bannersData = [], galleryData = [], historyData = [];

// --- DOM Elements ---
const authContainer = document.getElementById('auth-container');
const adminContainer = document.getElementById('admin-container');
const loginForm = document.getElementById('login-form');
const loginError = document.getElementById('login-error');
const logoutBtn = document.getElementById('logout-btn');

// --- APP INITIALIZATION ---
function initializeApp() {
    const firebaseConfig = {
        apiKey: "AIzaSyCIC1WLirQbsY8XDsVhMWHVv8GO2nwcyjk",
        authDomain: "lobster-shack-bali.firebaseapp.com",
        projectId: "lobster-shack-bali",
        storageBucket: "lobster-shack-bali.appspot.com",
        messagingSenderId: "42452974733",
        appId: "1:42452974733:web:5cad780f8295edd2b5f6c4"
    };

    try {
        firebase.initializeApp(firebaseConfig);
        auth = firebase.auth();
        db = firebase.firestore();
        storage = firebase.storage();
        setupAuthListener();
    } catch (error) {
        console.error("Firebase initialization failed:", error);
        document.body.innerHTML = `<h1>Error: Could not initialize application.</h1>`;
    }
}

// --- AUTHENTICATION ---
function setupAuthListener() {
    auth.onAuthStateChanged(user => {
        if (user) {
            authContainer.style.display = 'none';
            adminContainer.style.display = 'flex';
            initAdminPanel();
        } else {
            authContainer.style.display = 'flex';
            adminContainer.style.display = 'none';
        }
    });

    loginForm.addEventListener('submit', e => {
        e.preventDefault();
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        auth.signInWithEmailAndPassword(email, password)
            .catch(error => {
                loginError.textContent = "Login Failed: " + error.message;
                loginError.style.display = 'block';
            });
    });

    logoutBtn.addEventListener('click', e => {
        e.preventDefault();
        auth.signOut();
    });
}

// --- PANEL SETUP ---
async function initAdminPanel() {
    setupNavigation();
    setupModals();
    setupImagePreviews();
    await loadAllData();
    setupForms(); // Setup forms after data is loaded
}

async function loadAllData() {
    try {
        await Promise.all([
            loadBanners(), loadGallery(), loadHistory(),
            loadCategories(), loadProducts(), loadContent(),
        ]);
        renderAllTables();
        populateCategoryDropdown();
    } catch (err) {
        console.error("Failed to load data:", err);
        alert("Could not load data. Check console for details.");
    }
}

function renderAllTables() {
    renderBanners(); renderGallery(); renderHistory();
    renderProducts(); renderCategories(); renderContent();
}

// --- NAVIGATION ---
function setupNavigation() {
    const navLinks = document.querySelectorAll('.sidebar-nav a');
    const pages = document.querySelectorAll('.page');
    const sidebar = document.querySelector('.sidebar');
    const menuToggle = document.querySelector('.menu-toggle');

    const switchPage = (hash) => {
        const targetId = 'page-' + (hash.substring(1) || 'dashboard');
        navLinks.forEach(link => link.classList.remove('active'));
        pages.forEach(page => page.classList.remove('active'));
        
        const activeLink = document.querySelector(`.sidebar-nav a[href="${hash}"]`) || document.querySelector('.sidebar-nav a[href="#dashboard"]');
        const activePage = document.getElementById(targetId) || document.getElementById('page-dashboard');

        if(activeLink) activeLink.classList.add('active');
        if(activePage) activePage.classList.add('active');

        if (window.innerWidth <= 992 && sidebar.classList.contains('open')) {
            sidebar.classList.remove('open');
            menuToggle.innerHTML = '<i class="fas fa-bars"></i>';
        }
    };

    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            if (link.id !== 'logout-btn') {
                e.preventDefault();
                window.location.hash = link.getAttribute('href');
            }
        });
    });
    
    window.addEventListener('hashchange', () => switchPage(window.location.hash));
    switchPage(window.location.hash);

    menuToggle.addEventListener('click', () => {
        sidebar.classList.toggle('open');
        menuToggle.innerHTML = sidebar.classList.contains('open') ? '<i class="fas fa-times"></i>' : '<i class="fas fa-bars"></i>';
    });
}

// --- MODALS & PREVIEWS ---
function setupModals() {
    document.querySelectorAll('.modal-overlay').forEach(modal => {
        modal.addEventListener('click', e => { if (e.target === modal) closeModal(modal.id); });
    });
    document.querySelectorAll('.modal-close-btn').forEach(btn => {
        btn.addEventListener('click', () => closeModal(btn.closest('.modal-overlay').id));
    });
}
const openModal = (modalId) => document.getElementById(modalId).classList.add('visible');
const closeModal = (modalId) => document.getElementById(modalId).classList.remove('visible');

function setupImagePreviews() {
    const handleFileChange = (inputId, previewId) => {
        const input = document.getElementById(inputId);
        if(!input) return;
        input.addEventListener('change', (e) => {
            const preview = document.getElementById(previewId);
            const file = e.target.files[0];
            if (file) {
                preview.src = URL.createObjectURL(file);
                preview.style.display = 'block';
            }
        });
    };
    handleFileChange('product-image', 'product-image-preview');
    handleFileChange('content-image', 'content-image-preview');
    handleFileChange('banner-image', 'banner-image-preview');
    handleFileChange('gallery-image', 'gallery-image-preview');
}

// --- DATA FETCHING ---
async function loadCollection(name, orderByField, orderDirection = 'asc') {
    let query = db.collection(name);
    if (orderByField) query = query.orderBy(orderByField, orderDirection);
    const snapshot = await query.get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}
async function loadProducts() { productsData = await loadCollection('products', 'name_en'); }
async function loadCategories() { categoriesData = await loadCollection('categories', 'id'); }
async function loadContent() { contentData = await loadCollection('content'); }
async function loadBanners() { bannersData = await loadCollection('banners', 'sort_order'); }
async function loadGallery() { galleryData = await loadCollection('gallery_images', 'sort_order'); }
async function loadHistory() { historyData = await loadCollection('history'); } // No sorting needed

// --- TABLE RENDERING ---
const renderTable = (tableId, data, rowRenderer) => {
    const tbody = document.querySelector(`#${tableId} tbody`);
    if(!tbody) return;
    tbody.innerHTML = data.map(rowRenderer).join('') || `<tr><td colspan="100%" style="text-align:center; padding: 2rem;">No data available.</td></tr>`;
};
const getImageUrl = (url) => url || 'https://via.placeholder.com/100x60?text=No+Img';
const renderActionButtons = (collection, id, name, imageUrl) => `
    <div class="action-btns">
        <button class="btn btn-sm btn-outline" onclick="editItem('${collection}', '${id}')"><i class="fas fa-edit"></i></button>
        <button class="btn btn-sm btn-danger" onclick="deleteItem('${collection}', '${id}', '${name.replace(/'/g, "\\'")}', '${imageUrl}')"><i class="fas fa-trash"></i></button>
    </div>`;

// --- REVISED History Rendering ---
const renderHistory = () => {
    const tbody = document.querySelector('#history-table tbody');
    if (!tbody) return;
    if (historyData.length === 0) {
        tbody.innerHTML = `<tr><td colspan="3" style="text-align:center; padding: 2rem;">No "About Us" article found. <button class="btn btn-sm" id="add-new-history-btn">Add One</button></td></tr>`;
        document.getElementById('add-new-history-btn').addEventListener('click', () => {
             resetForm('history-form', 'history-modal-title', 'Add About Us Article');
             openModal('history-modal');
        });
    } else {
        tbody.innerHTML = historyData.map(h => `
            <tr>
                <td data-label="Title">${h.title_en}</td>
                <td data-label="Content Preview">${(h.text_en || '').substring(0, 100)}...</td>
                <td data-label="Action">
                    <button class="btn btn-sm btn-outline" onclick="editItem('history', '${h.id}')"><i class="fas fa-edit"></i> Edit</button>
                </td>
            </tr>
        `).join('');
    }
};

const renderBanners = () => renderTable('banners-table', bannersData, b => `<tr><td data-label="Image"><img src="${getImageUrl(b.image_url)}" class="thumb-image"></td><td data-label="Sort Order">${b.sort_order}</td><td data-label="Actions">${renderActionButtons('banners', b.id, `Banner #${b.sort_order}`, b.image_url)}</td></tr>`);
const renderGallery = () => renderTable('gallery-table', galleryData, g => `<tr><td data-label="Image"><img src="${getImageUrl(g.image_url)}" class="thumb-image"></td><td data-label="Sort Order">${g.sort_order}</td><td data-label="Caption">${g.caption_id}<br><small class="text-muted">${g.caption_en}</small></td><td data-label="Actions">${renderActionButtons('gallery_images', g.id, g.caption_en, g.image_url)}</td></tr>`);
const renderProducts = () => renderTable('products-table', productsData, p => `<tr><td data-label="Image"><img src="${getImageUrl(p.imageUrl)}" class="thumb-image"></td><td data-label="Name">${p.name_id}<br><small class="text-muted">${p.name_en}</small></td><td data-label="Category">${p.category_name}</td><td data-label="Price">${new Intl.NumberFormat('id-ID').format(p.price)}</td><td data-label="Featured"><i class="fas ${p.is_featured ? 'fa-check-circle' : 'fa-times-circle'}"></i></td><td data-label="Actions">${renderActionButtons('products', p.id, p.name_en, p.imageUrl)}</td></tr>`);
const renderCategories = () => renderTable('categories-table', categoriesData, c => `<tr><td data-label="Sort Order">${c.id}</td><td data-label="Name">${c.name}</td><td data-label="Actions">${renderActionButtons('categories', c.id, c.name)}</td></tr>`);
const renderContent = () => renderTable('content-table', contentData.sort((a,b) => a.id.localeCompare(b.id)), c => `<tr><td data-label="Key"><strong>${c.id}</strong></td><td data-label="Text (ID)">${(c.text_id || '').substring(0, 50)}...</td><td data-label="Text (EN)">${(c.text_en || '').substring(0, 50)}...</td><td data-label="Image">${c.imageUrl ? `<img src="${c.imageUrl}" class="thumb-image">` : 'N/A'}</td><td data-label="Action"><div class="action-btns"><button class="btn btn-sm btn-outline" onclick="editItem('content', '${c.id}')"><i class="fas fa-edit"></i></button></div></td></tr>`);

// --- FORM HANDLING ---
function populateCategoryDropdown() {
    const select = document.getElementById('product-category');
    select.innerHTML = '<option value="">Select a category</option>';
    categoriesData.forEach(c => { select.innerHTML += `<option value="${c.name}">${c.name}</option>`; });
}

const resetForm = (formId, modalTitleId, titleText) => {
    const form = document.getElementById(formId);
    if(form) form.reset();
    document.querySelectorAll(`#${formId} input[type=hidden]`).forEach(input => input.value = '');
    const title = document.getElementById(modalTitleId);
    if(title) title.textContent = titleText;
    document.querySelectorAll(`#${formId} .image-preview`).forEach(img => { img.style.display = 'none'; img.src = '#'; });
};
const uploadImage = async (file, path) => {
    if (!file) return null;
    const filePath = `${path}/${Date.now()}_${file.name}`;
    const fileSnapshot = await storage.ref(filePath).put(file);
    return fileSnapshot.ref.getDownloadURL();
};
const saveToDb = async (collectionName, id, data) => {
    if (id) {
        await db.collection(collectionName).doc(id).update(data);
    } else {
        await db.collection(collectionName).add(data);
    }
};

function setupForms() {
    document.getElementById('add-new-banner-btn').addEventListener('click', () => { resetForm('banner-form', 'banner-modal-title', 'Add Banner'); openModal('banner-modal'); });
    document.getElementById('add-new-gallery-btn').addEventListener('click', () => { resetForm('gallery-form', 'gallery-modal-title', 'Add Gallery Image'); openModal('gallery-modal'); });
    document.getElementById('add-new-product-btn').addEventListener('click', () => { resetForm('product-form', 'product-modal-title', 'Add Product'); openModal('product-modal'); });
    document.getElementById('add-new-category-btn').addEventListener('click', () => { resetForm('category-form', 'category-modal-title', 'Add Category'); openModal('category-modal'); });

    document.getElementById('history-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = document.getElementById('history-id').value;
        const data = {
            title_id: document.getElementById('history-title-id').value,
            title_en: document.getElementById('history-title-en').value,
            text_id: document.getElementById('history-text-id').value,
            text_en: document.getElementById('history-text-en').value
        };
        try {
            await saveToDb('history', id, data);
            closeModal('history-modal');
            await loadHistory(); renderHistory();
        } catch (err) { alert("Error saving article: " + err.message); }
    });
    
    // Other form submissions...
    document.getElementById('product-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = document.getElementById('product-id').value;
        const imageFile = document.getElementById('product-image').files[0];
        const data = {
            name_id: document.getElementById('product-name-id').value, name_en: document.getElementById('product-name-en').value,
            description_id: document.getElementById('product-description-id').value, description_en: document.getElementById('product-description-en').value,
            price: Number(document.getElementById('product-price').value), category_name: document.getElementById('product-category').value,
            is_featured: document.getElementById('product-featured').checked, gofood_link: document.getElementById('product-gofood-link').value.trim(),
            grabfood_link: document.getElementById('product-grabfood-link').value.trim()
        };
        try {
            const imageUrl = await uploadImage(imageFile, 'products');
            if (imageUrl) data.imageUrl = imageUrl;
            await saveToDb('products', id, data);
            closeModal('product-modal'); await loadProducts(); renderProducts();
        } catch(err) { alert("Error saving product: " + err.message); }
    });
    document.getElementById('banner-form').addEventListener('submit', async (e) => { e.preventDefault(); const id=document.getElementById('banner-id').value; const f=document.getElementById('banner-image').files[0]; const d={sort_order:Number(document.getElementById('banner-sort-order').value)}; try{const u=await uploadImage(f,'banners'); if(u)d.image_url=u; else if(!id)return alert("Image required"); await saveToDb('banners',id,d); closeModal('banner-modal');await loadBanners();renderBanners()}catch(err){alert("Error: "+err.message)} });
    document.getElementById('gallery-form').addEventListener('submit', async (e) => { e.preventDefault(); const id=document.getElementById('gallery-id').value; const f=document.getElementById('gallery-image').files[0]; const d={sort_order:Number(document.getElementById('gallery-sort-order').value),caption_id:document.getElementById('gallery-caption-id').value,caption_en:document.getElementById('gallery-caption-en').value}; try{const u=await uploadImage(f,'gallery'); if(u)d.image_url=u; else if(!id)return alert("Image required"); await saveToDb('gallery_images',id,d); closeModal('gallery-modal');await loadGallery();renderGallery()}catch(err){alert("Error: "+err.message)} });
    document.getElementById('category-form').addEventListener('submit', async (e) => { e.preventDefault(); const id=document.getElementById('category-id').value; const d={name:document.getElementById('category-name').value,id:Number(document.getElementById('category-sort-id').value)}; try{await saveToDb('categories',id,d); closeModal('category-modal');await loadCategories();renderCategories();populateCategoryDropdown()}catch(err){alert("Error: "+err.message)} });
    document.getElementById('content-form').addEventListener('submit', async (e) => { e.preventDefault(); const k=document.getElementById('content-key').value; const f=document.getElementById('content-image').files[0]; let d={text_id:document.getElementById('content-text-id').value,text_en:document.getElementById('content-text-en').value}; try{const u=await uploadImage(f,'content'); if(u)d.imageUrl=u; await db.collection('content').doc(k).update(d); closeModal('content-modal');await loadContent();renderContent()}catch(err){alert("Error: "+err.message)} });
}

// --- EDIT & DELETE ---
const populateForm = (data, fields) => {
    fields.forEach(field => {
        const element = document.getElementById(field.id);
        if(!element) return;
        if (element.type === 'checkbox') { element.checked = data[field.key] || false; } 
        else { element.value = data[field.key] || ''; }
    });
};
const showImagePreview = (previewId, imageUrl) => {
    const preview = document.getElementById(previewId);
    if(!preview) return;
    if (imageUrl) { preview.src = imageUrl; preview.style.display = 'block'; }
    else { preview.style.display = 'none'; }
};

window.editItem = (collection, id) => {
    let item;
    if (collection === 'history') {
        item = historyData.find(i => i.id === id);
        if(!item) return;
        resetForm('history-form', 'history-modal-title', 'Edit About Us Article');
        populateForm(item, [
            {id: 'history-id', key: 'id'}, {id: 'history-title-id', key: 'title_id'},
            {id: 'history-title-en', key: 'title_en'}, {id: 'history-text-id', key: 'text_id'},
            {id: 'history-text-en', key: 'text_en'}
        ]);
        openModal('history-modal');
        return;
    }
    
    // Original edit logic for other collections
    let modalId, modalTitle, fields, previewId, imageUrlKey;
    switch(collection) {
        case 'banners': item = bannersData.find(i => i.id === id); modalId = 'banner-modal'; modalTitle = 'Edit Banner'; fields = [{id: 'banner-id', key: 'id'}, {id: 'banner-sort-order', key: 'sort_order'}]; previewId = 'banner-image-preview'; imageUrlKey = 'image_url'; break;
        case 'gallery_images': item = galleryData.find(i => i.id === id); modalId = 'gallery-modal'; modalTitle = 'Edit Gallery Image'; fields = [{id: 'gallery-id', key: 'id'}, {id: 'gallery-sort-order', key: 'sort_order'}, {id: 'gallery-caption-id', key: 'caption_id'}, {id: 'gallery-caption-en', key: 'caption_en'}]; previewId = 'gallery-image-preview'; imageUrlKey = 'image_url'; break;
        case 'products': item = productsData.find(i => i.id === id); modalId = 'product-modal'; modalTitle = 'Edit Product'; fields = [{id: 'product-id', key: 'id'}, {id: 'product-name-id', key: 'name_id'}, {id: 'product-name-en', key: 'name_en'}, {id: 'product-description-id', key: 'description_id'}, {id: 'product-description-en', key: 'description_en'}, {id: 'product-price', key: 'price'}, {id: 'product-category', key: 'category_name'}, {id: 'product-featured', key: 'is_featured'}, {id: 'product-gofood-link', key: 'gofood_link'}, {id: 'product-grabfood-link', key: 'grabfood_link'}]; previewId = 'product-image-preview'; imageUrlKey = 'imageUrl'; break;
        case 'categories': item = categoriesData.find(c => c.id === id); modalId = 'category-modal'; modalTitle = 'Edit Category'; fields = [{id: 'category-id', key: 'id'}, {id: 'category-name', key: 'name'}, {id: 'category-sort-id', key: 'id'}]; break;
        case 'content': item = contentData.find(c => c.id === id); modalId = 'content-modal'; modalTitle = `Edit Content: ${id}`; document.getElementById('content-key-display').textContent = id; fields = [{id: 'content-key', key: 'id'}, {id: 'content-text-id', key: 'text_id'}, {id: 'content-text-en', key: 'text_en'}]; previewId = 'content-image-preview'; imageUrlKey = 'imageUrl'; break;
    }
    if (!item || !modalId) return;
    resetForm(`${modalId.replace('-modal','')}-form`, `${modalId.replace('-modal','')}-modal-title`, modalTitle);
    populateForm(item, fields);
    if(previewId && imageUrlKey) showImagePreview(previewId, item[imageUrlKey]);
    openModal(modalId);
};

window.deleteItem = async (collection, id, name, imageUrl) => {
    if (!confirm(`Are you sure you want to delete "${name}"? This cannot be undone.`)) return;
    try {
        if (imageUrl && imageUrl.startsWith('https://firebasestorage.googleapis.com')) {
            await storage.refFromURL(imageUrl).delete().catch(err => console.warn("Image delete failed:", err.message));
        }
        await db.collection(collection).doc(id).delete();
        
        const reloadMap = {
            'banners': async () => { await loadBanners(); renderBanners(); },
            'gallery_images': async () => { await loadGallery(); renderGallery(); },
            'history': async () => { await loadHistory(); renderHistory(); },
            'products': async () => { await loadProducts(); renderProducts(); },
            'categories': async () => { await loadCategories(); renderCategories(); populateCategoryDropdown(); },
        };
        if(reloadMap[collection]) await reloadMap[collection]();

        alert(`"${name}" was deleted successfully.`);
    } catch(err) {
        alert("Failed to delete item: " + err.message);
    }
};

// --- START APP ---
document.addEventListener('DOMContentLoaded', initializeApp);
