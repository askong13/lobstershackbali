// products.js
const productsSection = document.getElementById('products-section');

// Function to load products data
async function loadProducts() {
    showSpinner();
    productsSection.innerHTML = `
        <h2>Product Management</h2>
        <button id="add-product-btn" class="btn btn-primary"><i class="fas fa-plus"></i> Add New Product</button>
        <div class="table-responsive">
            <table class="admin-table">
                <thead>
                    <tr>
                        <th>Image</th>
                        <th>Name (ID)</th>
                        <th>Name (EN)</th>
                        <th>Price</th>
                        <th>Category</th>
                        <th>Featured</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody id="products-table-body">
                    </tbody>
            </table>
        </div>

        <div id="product-modal" class="modal-overlay" style="display: none;">
            <div class="modal-content">
                <div class="modal-header">
                    <h3 id="product-modal-title">Add/Edit Product</h3>
                    <button class="modal-close-btn">&times;</button>
                </div>
                <div class="modal-body">
                    <form id="product-form">
                        <input type="hidden" id="product-id">
                        <div class="form-group">
                            <label for="product-name-id">Name (Indonesian)</label>
                            <input type="text" id="product-name-id" required>
                        </div>
                        <div class="form-group">
                            <label for="product-name-en">Name (English)</label>
                            <input type="text" id="product-name-en" required>
                        </div>
                        <div class="form-group">
                            <label for="product-description-id">Description (Indonesian)</label>
                            <textarea id="product-description-id" rows="3"></textarea>
                        </div>
                        <div class="form-group">
                            <label for="product-description-en">Description (English)</label>
                            <textarea id="product-description-en" rows="3"></textarea>
                        </div>
                        <div class="form-group">
                            <label for="product-price">Price (Rp)</label>
                            <input type="number" id="product-price" required min="0">
                        </div>
                        <div class="form-group">
                            <label for="product-category">Category</label>
                            <select id="product-category" required>
                                </select>
                        </div>
                        <div class="form-group">
                            <label for="product-image-upload">Product Image</label>
                            <input type="file" id="product-image-upload" accept="image/*">
                            <img id="product-current-image" src="" alt="Current Product Image" style="max-width: 150px; margin-top: 10px; display: none;">
                        </div>
                        <div class="form-group">
                            <input type="checkbox" id="product-is-featured">
                            <label for="product-is-featured">Featured Product</label>
                        </div>
                        <button type="submit" class="btn btn-primary" id="save-product-btn">Save Product</button>
                    </form>
                </div>
            </div>
        </div>
    `;

    const productsTableBody = document.getElementById('products-table-body');
    const addProductBtn = document.getElementById('add-product-btn');
    const productModal = document.getElementById('product-modal');
    const productModalTitle = document.getElementById('product-modal-title');
    const productForm = document.getElementById('product-form');
    const productIdInput = document.getElementById('product-id');
    const productNameIdInput = document.getElementById('product-name-id');
    const productNameEnInput = document.getElementById('product-name-en');
    const productDescriptionIdInput = document.getElementById('product-description-id');
    const productDescriptionEnInput = document.getElementById('product-description-en');
    const productPriceInput = document.getElementById('product-price');
    const productCategorySelect = document.getElementById('product-category');
    const productImageUploadInput = document.getElementById('product-image-upload');
    const productCurrentImage = document.getElementById('product-current-image');
    const productIsFeaturedInput = document.getElementById('product-is-featured');
    const saveProductBtn = document.getElementById('save-product-btn');
    const modalCloseBtn = productModal.querySelector('.modal-close-btn');

    let currentImageUrl = ''; // To store current image URL for editing

    // Populate categories
    const categoriesSnapshot = await db.collection('categories').orderBy('id').get();
    productCategorySelect.innerHTML = categoriesSnapshot.docs.map(doc => {
        const category = doc.data();
        return `<option value="${category.name}">${category.name}</option>`;
    }).join('');

    // Fetch and display products
    db.collection('products').onSnapshot(snapshot => {
        productsTableBody.innerHTML = '';
        snapshot.docs.forEach(doc => {
            const product = doc.data();
            const row = productsTableBody.insertRow();
            row.innerHTML = `
                <td><img src="${product.imageUrl}" alt="${product.name_en}" style="width: 50px; height: 50px; object-fit: cover; border-radius: 5px;"></td>
                <td>${product.name_id}</td>
                <td>${product.name_en}</td>
                <td>Rp ${new Intl.NumberFormat('id-ID').format(product.price)}</td>
                <td>${product.category_name}</td>
                <td>${product.is_featured ? '<i class="fas fa-check-circle text-success"></i>' : '<i class="fas fa-times-circle text-danger"></i>'}</td>
                <td>
                    <button class="btn btn-edit" data-id="${doc.id}"><i class="fas fa-edit"></i></button>
                    <button class="btn btn-delete" data-id="${doc.id}"><i class="fas fa-trash-alt"></i></button>
                </td>
            `;
        });
        hideSpinner();
    }, error => {
        console.error("Error fetching products: ", error);
        showToast("Failed to load products.", 'error');
        hideSpinner();
    });

    // Open Add Product Modal
    addProductBtn.addEventListener('click', () => {
        productForm.reset();
        productIdInput.value = '';
        productModalTitle.textContent = 'Add New Product';
        productCurrentImage.style.display = 'none';
        productCurrentImage.src = '';
        currentImageUrl = '';
        productModal.style.display = 'flex';
    });

    // Close Modal
    modalCloseBtn.addEventListener('click', () => {
        productModal.style.display = 'none';
    });
    productModal.addEventListener('click', (e) => {
        if (e.target === productModal) {
            productModal.style.display = 'none';
        }
    });

    // Handle Edit/Delete actions
    productsTableBody.addEventListener('click', async (e) => {
        const id = e.target.closest('button')?.dataset.id;
        if (!id) return;

        if (e.target.closest('.btn-edit')) {
            showSpinner();
            const doc = await db.collection('products').doc(id).get();
            if (doc.exists) {
                const product = doc.data();
                productIdInput.value = doc.id;
                productNameIdInput.value = product.name_id;
                productNameEnInput.value = product.name_en;
                productDescriptionIdInput.value = product.description_id || '';
                productDescriptionEnInput.value = product.description_en || '';
                productPriceInput.value = product.price;
                productCategorySelect.value = product.category_name;
                productIsFeaturedInput.checked = product.is_featured;
                currentImageUrl = product.imageUrl;
                productCurrentImage.src = product.imageUrl;
                productCurrentImage.style.display = 'block';

                productModalTitle.textContent = 'Edit Product';
                productModal.style.display = 'flex';
            } else {
                showToast("Product not found!", 'error');
            }
            hideSpinner();
        } else if (e.target.closest('.btn-delete')) {
            if (confirm('Are you sure you want to delete this product?')) {
                showSpinner();
                try {
                    const productDoc = await db.collection('products').doc(id).get();
                    if (productDoc.exists && productDoc.data().imageUrl) {
                        const imageUrl = productDoc.data().imageUrl;
                        const imageRef = storage.refFromURL(imageUrl);
                        await imageRef.delete();
                    }
                    await db.collection('products').doc(id).delete();
                    showToast("Product deleted successfully!", 'success');
                } catch (error) {
                    console.error("Error deleting product: ", error);
                    showToast(`Failed to delete product: ${error.message}`, 'error');
                } finally {
                    hideSpinner();
                }
            }
        }
    });

    // Handle Product Form Submission
    productForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        saveProductBtn.disabled = true;
        showSpinner();

        const id = productIdInput.value;
        const name_id = productNameIdInput.value;
        const name_en = productNameEnInput.value;
        const description_id = productDescriptionIdInput.value;
        const description_en = productDescriptionEnInput.value;
        const price = parseFloat(productPriceInput.value);
        const category_name = productCategorySelect.value;
        const is_featured = productIsFeaturedInput.checked;
        const imageFile = productImageUploadInput.files[0];

        let imageUrl = currentImageUrl; // Default to current image if no new one uploaded

        try {
            if (imageFile) {
                const storageRef = storage.ref(`product_images/${Date.now()}_${imageFile.name}`);
                await storageRef.put(imageFile);
                imageUrl = await storageRef.getDownloadURL();

                // Delete old image if it exists and is different
                if (currentImageUrl && currentImageUrl !== imageUrl) {
                    try {
                        const oldImageRef = storage.refFromURL(currentImageUrl);
                        await oldImageRef.delete();
                    } catch (deleteError) {
                        console.warn("Could not delete old image:", deleteError.message);
                    }
                }
            }

            const productData = {
                name_id,
                name_en,
                description_id,
                description_en,
                price,
                category_name,
                is_featured,
                imageUrl,
                timestamp: firebase.firestore.FieldValue.serverTimestamp() // Add timestamp
            };

            if (id) {
                await db.collection('products').doc(id).update(productData);
                showToast("Product updated successfully!", 'success');
            } else {
                await db.collection('products').add(productData);
                showToast("Product added successfully!", 'success');
            }
            productModal.style.display = 'none';
        } catch (error) {
            console.error("Error saving product: ", error);
            showToast(`Failed to save product: ${error.message}`, 'error');
        } finally {
            saveProductBtn.disabled = false;
            hideSpinner();
        }
    });
}
