// admin/js/gallery.js
const gallerySection = document.getElementById('gallery-section');
let galleryModal; // Will be defined when loadGallery is called

async function loadGallery() {
    showSpinner();
    gallerySection.innerHTML = `
        <h2>Gallery Management</h2>
        <button id="add-gallery-btn" class="btn btn-primary" style="margin-bottom: 20px;"><i class="fas fa-plus"></i> Add New Gallery Image</button>
        <div class="table-responsive">
            <table class="admin-table">
                <thead>
                    <tr>
                        <th>Image</th>
                        <th>Caption (ID)</th>
                        <th>Caption (EN)</th>
                        <th>Sort Order</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody id="gallery-table-body">
                    </tbody>
            </table>
        </div>

        <div id="gallery-modal" class="modal-overlay">
            <div class="modal-content">
                <div class="modal-header">
                    <h3 id="gallery-modal-title">Add/Edit Gallery Image</h3>
                    <button class="modal-close-btn">&times;</button>
                </div>
                <div class="modal-body">
                    <form id="gallery-form">
                        <input type="hidden" id="gallery-id">
                        <div class="form-group">
                            <label for="gallery-image-upload">Gallery Image</label>
                            <input type="file" id="gallery-image-upload" accept="image/*">
                            <img id="gallery-current-image" src="" alt="Current Gallery Image" style="max-width: 200px; margin-top: 10px; display: none;">
                        </div>
                        <div class="form-group">
                            <label for="gallery-caption-id">Caption (Indonesian)</label>
                            <textarea id="gallery-caption-id" rows="2"></textarea>
                        </div>
                        <div class="form-group">
                            <label for="gallery-caption-en">Caption (English)</label>
                            <textarea id="gallery-caption-en" rows="2"></textarea>
                        </div>
                        <div class="form-group">
                            <label for="gallery-sort-order">Sort Order</label>
                            <input type="number" id="gallery-sort-order" min="1" required>
                        </div>
                        <button type="submit" class="btn btn-primary" id="save-gallery-btn">Save Gallery Image</button>
                    </form>
                </div>
            </div>
        </div>
    `;

    const galleryTableBody = document.getElementById('gallery-table-body');
    const addGalleryBtn = document.getElementById('add-gallery-btn');
    galleryModal = document.getElementById('gallery-modal');
    const galleryModalTitle = document.getElementById('gallery-modal-title');
    const galleryForm = document.getElementById('gallery-form');
    const galleryIdInput = document.getElementById('gallery-id');
    const galleryImageUploadInput = document.getElementById('gallery-image-upload');
    const galleryCurrentImage = document.getElementById('gallery-current-image');
    const galleryCaptionIdInput = document.getElementById('gallery-caption-id');
    const galleryCaptionEnInput = document.getElementById('gallery-caption-en');
    const gallerySortOrderInput = document.getElementById('gallery-sort-order');
    const saveGalleryBtn = document.getElementById('save-gallery-btn');
    const modalCloseBtn = galleryModal.querySelector('.modal-close-btn');

    let currentImageUrl = ''; // To store current image URL for editing

    // Real-time listener for gallery images
    db.collection('gallery_images').orderBy('sort_order').onSnapshot(snapshot => {
        galleryTableBody.innerHTML = '';
        if (snapshot.empty) {
            galleryTableBody.innerHTML = `<tr><td colspan="5" style="text-align: center;">No gallery images found.</td></tr>`;
        } else {
            snapshot.docs.forEach(doc => {
                const image = doc.data();
                const row = galleryTableBody.insertRow();
                row.innerHTML = `
                    <td><img src="${image.image_url}" alt="${image.caption_en}" style="width: 80px; height: 50px; object-fit: cover; border-radius: 5px;"></td>
                    <td>${image.caption_id || 'N/A'}</td>
                    <td>${image.caption_en || 'N/A'}</td>
                    <td>${image.sort_order}</td>
                    <td>
                        <button class="btn btn-edit" data-id="${doc.id}"><i class="fas fa-edit"></i></button>
                        <button class="btn btn-delete" data-id="${doc.id}"><i class="fas fa-trash-alt"></i></button>
                    </td>
                `;
            });
        }
        hideSpinner();
    }, error => {
        console.error("Error fetching gallery images: ", error);
        showToast("Failed to load gallery images.", 'error');
        hideSpinner();
    });

    // Open Add Gallery Modal
    addGalleryBtn.addEventListener('click', () => {
        galleryForm.reset();
        galleryIdInput.value = '';
        galleryModalTitle.textContent = 'Add New Gallery Image';
        galleryCurrentImage.style.display = 'none';
        galleryCurrentImage.src = '';
        currentImageUrl = '';
        galleryImageUploadInput.required = true; // Image required for new
        showModal(galleryModal);
    });

    // Close Modal
    modalCloseBtn.addEventListener('click', () => {
        hideModal(galleryModal);
    });
    galleryModal.addEventListener('click', (e) => {
        if (e.target === galleryModal) {
            hideModal(galleryModal);
        }
    });

    // Handle Edit/Delete actions (delegated listener)
    galleryTableBody.addEventListener('click', async (e) => {
        const id = e.target.closest('button')?.dataset.id;
        if (!id) return;

        if (e.target.closest('.btn-edit')) {
            showSpinner();
            const doc = await db.collection('gallery_images').doc(id).get();
            if (doc.exists) {
                const image = doc.data();
                galleryIdInput.value = doc.id;
                galleryCaptionIdInput.value = image.caption_id || '';
                galleryCaptionEnInput.value = image.caption_en || '';
                gallerySortOrderInput.value = image.sort_order;
                currentImageUrl = image.image_url;
                galleryCurrentImage.src = image.image_url;
                galleryCurrentImage.style.display = 'block';
                galleryImageUploadInput.required = false; // Not required when editing

                galleryModalTitle.textContent = 'Edit Gallery Image';
                showModal(galleryModal);
            } else {
                showToast("Gallery image not found!", 'error');
            }
            hideSpinner();
        } else if (e.target.closest('.btn-delete')) {
            if (confirm('Are you sure you want to delete this gallery image?')) {
                showSpinner();
                try {
                    const imageDoc = await db.collection('gallery_images').doc(id).get();
                    if (imageDoc.exists && imageDoc.data().image_url) {
                        const imageUrl = imageDoc.data().image_url;
                        const imageRef = storage.refFromURL(imageUrl);
                        await imageRef.delete();
                    }
                    await db.collection('gallery_images').doc(id).delete();
                    showToast("Gallery image deleted successfully!", 'success');
                } catch (error) {
                    console.error("Error deleting gallery image: ", error);
                    showToast(`Failed to delete gallery image: ${error.message}`, 'error');
                } finally {
                    hideSpinner();
                }
            }
        }
    });

    // Handle Gallery Form Submission
    galleryForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        saveGalleryBtn.disabled = true;
        showSpinner();

        const id = galleryIdInput.value;
        const caption_id = galleryCaptionIdInput.value.trim();
        const caption_en = galleryCaptionEnInput.value.trim();
        const sort_order = parseInt(gallerySortOrderInput.value);
        const imageFile = galleryImageUploadInput.files[0];

        let imageUrl = currentImageUrl; // Default to current image if no new one uploaded

        try {
            if (imageFile) {
                const storageRef = storage.ref(`gallery_images/${Date.now()}_${imageFile.name}`);
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
            } else if (!id) { // If adding new and no image uploaded
                showToast("Gallery image is required for new entries.", 'error');
                return;
            }

            const imageData = {
                caption_id,
                caption_en,
                sort_order,
                image_url: imageUrl,
                timestamp: firebase.firestore.FieldValue.serverTimestamp()
            };

            if (id) {
                await db.collection('gallery_images').doc(id).update(imageData);
                showToast("Gallery image updated successfully!", 'success');
            } else {
                await db.collection('gallery_images').add(imageData);
                showToast("Gallery image added successfully!", 'success');
            }
            hideModal(galleryModal);
        } catch (error) {
            console.error("Error saving gallery image: ", error);
            showToast(`Failed to save gallery image: ${error.message}`, 'error');
        } finally {
            saveGalleryBtn.disabled = false;
            hideSpinner();
        }
    });
}
