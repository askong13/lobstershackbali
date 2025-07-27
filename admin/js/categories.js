// admin/js/categories.js
const categoriesSection = document.getElementById('categories-section');
let categoryModal; // Will be defined when loadCategories is called

async function loadCategories() {
    showSpinner();
    categoriesSection.innerHTML = `
        <h2>Category Management</h2>
        <button id="add-category-btn" class="btn btn-primary" style="margin-bottom: 20px;"><i class="fas fa-plus"></i> Add New Category</button>
        <div class="table-responsive">
            <table class="admin-table">
                <thead>
                    <tr>
                        <th>Category Name</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody id="categories-table-body">
                    </tbody>
            </table>
        </div>

        <div id="category-modal" class="modal-overlay">
            <div class="modal-content">
                <div class="modal-header">
                    <h3 id="category-modal-title">Add/Edit Category</h3>
                    <button class="modal-close-btn">&times;</button>
                </div>
                <div class="modal-body">
                    <form id="category-form">
                        <input type="hidden" id="category-id-field">
                        <div class="form-group">
                            <label for="category-name">Category Name</label>
                            <input type="text" id="category-name" required>
                        </div>
                        <button type="submit" class="btn btn-primary" id="save-category-btn">Save Category</button>
                    </form>
                </div>
            </div>
        </div>
    `;

    const categoriesTableBody = document.getElementById('categories-table-body');
    const addCategoryBtn = document.getElementById('add-category-btn');
    categoryModal = document.getElementById('category-modal');
    const categoryModalTitle = document.getElementById('category-modal-title');
    const categoryForm = document.getElementById('category-form');
    const categoryIdField = document.getElementById('category-id-field');
    const categoryNameInput = document.getElementById('category-name');
    const saveCategoryBtn = document.getElementById('save-category-btn');
    const modalCloseBtn = categoryModal.querySelector('.modal-close-btn');

    // Real-time listener for categories
    db.collection('categories').orderBy('id').onSnapshot(snapshot => {
        categoriesTableBody.innerHTML = '';
        if (snapshot.empty) {
            categoriesTableBody.innerHTML = `<tr><td colspan="2" style="text-align: center;">No categories found.</td></tr>`;
        } else {
            snapshot.docs.forEach(doc => {
                const category = doc.data();
                const row = categoriesTableBody.insertRow();
                row.innerHTML = `
                    <td>${category.name}</td>
                    <td>
                        <button class="btn btn-edit" data-id="${doc.id}" data-name="${category.name}"><i class="fas fa-edit"></i></button>
                        <button class="btn btn-delete" data-id="${doc.id}"><i class="fas fa-trash-alt"></i></button>
                    </td>
                `;
            });
        }
        hideSpinner();
    }, error => {
        console.error("Error fetching categories: ", error);
        showToast("Failed to load categories.", 'error');
        hideSpinner();
    });

    // Open Add Category Modal
    addCategoryBtn.addEventListener('click', () => {
        categoryForm.reset();
        categoryIdField.value = '';
        categoryModalTitle.textContent = 'Add New Category';
        showModal(categoryModal);
    });

    // Close Modal
    modalCloseBtn.addEventListener('click', () => {
        hideModal(categoryModal);
    });
    categoryModal.addEventListener('click', (e) => {
        if (e.target === categoryModal) {
            hideModal(categoryModal);
        }
    });

    // Handle Edit/Delete actions (delegated listener)
    categoriesTableBody.addEventListener('click', async (e) => {
        const id = e.target.closest('button')?.dataset.id;
        if (!id) return;

        if (e.target.closest('.btn-edit')) {
            const name = e.target.closest('button').dataset.name;
            categoryIdField.value = id;
            categoryNameInput.value = name;
            categoryModalTitle.textContent = 'Edit Category';
            showModal(categoryModal);
        } else if (e.target.closest('.btn-delete')) {
            if (confirm('Are you sure you want to delete this category? This will NOT delete products associated with it, but they might become unfilterable by category on the frontend unless you reassign them.')) {
                showSpinner();
                try {
                    await db.collection('categories').doc(id).delete();
                    showToast("Category deleted successfully!", 'success');
                } catch (error) {
                    console.error("Error deleting category: ", error);
                    showToast(`Failed to delete category: ${error.message}`, 'error');
                } finally {
                    hideSpinner();
                }
            }
        }
    });

    // Handle Category Form Submission
    categoryForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        saveCategoryBtn.disabled = true;
        showSpinner();

        const id = categoryIdField.value;
        const name = categoryNameInput.value.trim();

        if (!name) {
            showToast("Category name cannot be empty.", 'error');
            saveCategoryBtn.disabled = false;
            hideSpinner();
            return;
        }

        try {
            if (id) {
                // Update existing
                await db.collection('categories').doc(id).update({ name: name });
                showToast("Category updated successfully!", 'success');
            } else {
                // Add new (Firestore will auto-generate ID)
                // You might want to also add a sequential 'id' field for sorting,
                // but for now, rely on Firestore doc ID or a simple order by name.
                await db.collection('categories').add({ name: name, id: Date.now() }); // Using timestamp as simple sort ID
                showToast("Category added successfully!", 'success');
            }
            hideModal(categoryModal);
        } catch (error) {
            console.error("Error saving category: ", error);
            showToast(`Failed to save category: ${error.message}`, 'error');
        } finally {
            saveCategoryBtn.disabled = false;
            hideSpinner();
        }
    });
}
