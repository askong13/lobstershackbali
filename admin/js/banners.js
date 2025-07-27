// admin/js/banners.js
const bannersSection = document.getElementById('banners-section');
let bannerModal; // Will be defined when loadBanners is called

async function loadBanners() {
    showSpinner();
    bannersSection.innerHTML = `
        <h2>Banner Management</h2>
        <button id="add-banner-btn" class="btn btn-primary" style="margin-bottom: 20px;"><i class="fas fa-plus"></i> Add New Banner</button>
        <div class="table-responsive">
            <table class="admin-table">
                <thead>
                    <tr>
                        <th>Image</th>
                        <th>Sort Order</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody id="banners-table-body">
                    </tbody>
            </table>
        </div>

        <div id="banner-modal" class="modal-overlay">
            <div class="modal-content">
                <div class="modal-header">
                    <h3 id="banner-modal-title">Add/Edit Banner</h3>
                    <button class="modal-close-btn">&times;</button>
                </div>
                <div class="modal-body">
                    <form id="banner-form">
                        <input type="hidden" id="banner-id">
                        <div class="form-group">
                            <label for="banner-image-upload">Banner Image</label>
                            <input type="file" id="banner-image-upload" accept="image/*">
                            <img id="banner-current-image" src="" alt="Current Banner Image" style="max-width: 200px; margin-top: 10px; display: none;">
                        </div>
                        <div class="form-group">
                            <label for="banner-sort-order">Sort Order</label>
                            <input type="number" id="banner-sort-order" min="1" required>
                        </div>
                        <button type="submit" class="btn btn-primary" id="save-banner-btn">Save Banner</button>
                    </form>
                </div>
            </div>
        </div>
    `;

    const bannersTableBody = document.getElementById('banners-table-body');
    const addBannerBtn = document.getElementById('add-banner-btn');
    bannerModal = document.getElementById('banner-modal');
    const bannerModalTitle = document.getElementById('banner-modal-title');
    const bannerForm = document.getElementById('banner-form');
    const bannerIdInput = document.getElementById('banner-id');
    const bannerImageUploadInput = document.getElementById('banner-image-upload');
    const bannerCurrentImage = document.getElementById('banner-current-image');
    const bannerSortOrderInput = document.getElementById('banner-sort-order');
    const saveBannerBtn = document.getElementById('save-banner-btn');
    const modalCloseBtn = bannerModal.querySelector('.modal-close-btn');

    let currentImageUrl = ''; // To store current image URL for editing

    // Real-time listener for banners
    db.collection('banners').orderBy('sort_order').onSnapshot(snapshot => {
        bannersTableBody.innerHTML = '';
        if (snapshot.empty) {
            bannersTableBody.innerHTML = `<tr><td colspan="3" style="text-align: center;">No banners found.</td></tr>`;
        } else {
            snapshot.docs.forEach(doc => {
                const banner = doc.data();
                const row = bannersTableBody.insertRow();
                row.innerHTML = `
                    <td><img src="${banner.image_url}" alt="Banner" style="width: 100px; height: 60px; object-fit: cover; border-radius: 5px;"></td>
                    <td>${banner.sort_order}</td>
                    <td>
                        <button class="btn btn-edit" data-id="${doc.id}"><i class="fas fa-edit"></i></button>
                        <button class="btn btn-delete" data-id="${doc.id}"><i class="fas fa-trash-alt"></i></button>
                    </td>
                `;
            });
        }
        hideSpinner();
    }, error => {
        console.error("Error fetching banners: ", error);
        showToast("Failed to load banners.", 'error');
        hideSpinner();
    });

    // Open Add Banner Modal
    addBannerBtn.addEventListener('click', () => {
        bannerForm.reset();
        bannerIdInput.value = '';
        bannerModalTitle.textContent = 'Add New Banner';
        bannerCurrentImage.style.display = 'none';
        bannerCurrentImage.src = '';
        currentImageUrl = '';
        bannerImageUploadInput.required = true; // Image required for new banner
        showModal(bannerModal);
    });

    // Close Modal
    modalCloseBtn.addEventListener('click', () => {
        hideModal(bannerModal);
    });
    bannerModal.addEventListener('click', (e) => {
        if (e.target === bannerModal) {
            hideModal(bannerModal);
        }
    });

    // Handle Edit/Delete actions (delegated listener)
    bannersTableBody.addEventListener('click', async (e) => {
        const id = e.target.closest('button')?.dataset.id;
        if (!id) return;

        if (e.target.closest('.btn-edit')) {
            showSpinner();
            const doc = await db.collection('banners').doc(id).get();
            if (doc.exists) {
                const banner = doc.data();
                bannerIdInput.value = doc.id;
                bannerSortOrderInput.value = banner.sort_order;
                currentImageUrl = banner.image_url;
                bannerCurrentImage.src = banner.image_url;
                bannerCurrentImage.style.display = 'block';
                bannerImageUploadInput.required = false; // Not required when editing

                bannerModalTitle.textContent = 'Edit Banner';
                showModal(bannerModal);
            } else {
                showToast("Banner not found!", 'error');
            }
            hideSpinner();
        } else if (e.target.closest('.btn-delete')) {
            if (confirm('Are you sure you want to delete this banner?')) {
                showSpinner();
                try {
                    const bannerDoc = await db.collection('banners').doc(id).get();
                    if (bannerDoc.exists && bannerDoc.data().image_url) {
                        const imageUrl = bannerDoc.data().image_url;
                        const imageRef = storage.refFromURL(imageUrl);
                        await imageRef.delete();
                    }
                    await db.collection('banners').doc(id).delete();
                    showToast("Banner deleted successfully!", 'success');
                } catch (error) {
                    console.error("Error deleting banner: ", error);
                    showToast(`Failed to delete banner: ${error.message}`, 'error');
                } finally {
                    hideSpinner();
                }
            }
        }
    });

    // Handle Banner Form Submission
    bannerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        saveBannerBtn.disabled = true;
        showSpinner();

        const id = bannerIdInput.value;
        const sort_order = parseInt(bannerSortOrderInput.value);
        const imageFile = bannerImageUploadInput.files[0];

        let imageUrl = currentImageUrl; // Default to current image if no new one uploaded

        try {
            if (imageFile) {
                const storageRef = storage.ref(`banner_images/${Date.now()}_${imageFile.name}`);
                await storageRef.put(imageFile);
                imageUrl = await storageRef.getDownloadURL();

                // Delete old image if it exists and is different
                if (currentImageUrl && currentImageUrl !== imageUrl) {
                    try {
                        const oldImageRef = storage.refFromURL(currentImageUrl);
                        await oldImageRef.delete();
                    } catch (deleteError) {
                        console.warn("Could not delete old image (might not exist or path issue):", deleteError.message);
                    }
                }
            } else if (!id) { // If adding new banner and no image selected
                showToast("Banner image is required for new banners.", 'error');
                return;
            }

            const bannerData = {
                sort_order,
                image_url: imageUrl,
                timestamp: firebase.firestore.FieldValue.serverTimestamp()
            };

            if (id) {
                await db.collection('banners').doc(id).update(bannerData);
                showToast("Banner updated successfully!", 'success');
            } else {
                await db.collection('banners').add(bannerData);
                showToast("Banner added successfully!", 'success');
            }
            hideModal(bannerModal);
        } catch (error) {
            console.error("Error saving banner: ", error);
            showToast(`Failed to save banner: ${error.message}`, 'error');
        } finally {
            saveBannerBtn.disabled = false;
            hideSpinner();
        }
    });
}
