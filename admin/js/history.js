// admin/js/history.js
const historySection = document.getElementById('history-section');
let historyModal; // Will be defined when loadHistory is called

async function loadHistory() {
    showSpinner();
    historySection.innerHTML = `
        <h2>History Management</h2>
        <button id="add-history-btn" class="btn btn-primary" style="margin-bottom: 20px;"><i class="fas fa-plus"></i> Add New History Item</button>
        <div class="table-responsive">
            <table class="admin-table">
                <thead>
                    <tr>
                        <th>Year</th>
                        <th>Title (ID)</th>
                        <th>Title (EN)</th>
                        <th>Sort Order</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody id="history-table-body">
                    </tbody>
            </table>
        </div>

        <div id="history-modal" class="modal-overlay">
            <div class="modal-content">
                <div class="modal-header">
                    <h3 id="history-modal-title">Add/Edit History Item</h3>
                    <button class="modal-close-btn">&times;</button>
                </div>
                <div class="modal-body">
                    <form id="history-form">
                        <input type="hidden" id="history-id">
                        <div class="form-group">
                            <label for="history-year">Year</label>
                            <input type="number" id="history-year" required min="1900" max="2100">
                        </div>
                        <div class="form-group">
                            <label for="history-title-id">Title (Indonesian)</label>
                            <input type="text" id="history-title-id" required>
                        </div>
                        <div class="form-group">
                            <label for="history-title-en">Title (English)</label>
                            <input type="text" id="history-title-en" required>
                        </div>
                        <div class="form-group">
                            <label for="history-text-id">Text (Indonesian)</label>
                            <textarea id="history-text-id" rows="3"></textarea>
                        </div>
                        <div class="form-group">
                            <label for="history-text-en">Text (English)</label>
                            <textarea id="history-text-en" rows="3"></textarea>
                        </div>
                        <div class="form-group">
                            <label for="history-sort-order">Sort Order</label>
                            <input type="number" id="history-sort-order" min="1" required>
                        </div>
                        <button type="submit" class="btn btn-primary" id="save-history-btn">Save History Item</button>
                    </form>
                </div>
            </div>
        </div>
    `;

    const historyTableBody = document.getElementById('history-table-body');
    const addHistoryBtn = document.getElementById('add-history-btn');
    historyModal = document.getElementById('history-modal');
    const historyModalTitle = document.getElementById('history-modal-title');
    const historyForm = document.getElementById('history-form');
    const historyIdInput = document.getElementById('history-id');
    const historyYearInput = document.getElementById('history-year');
    const historyTitleIdInput = document.getElementById('history-title-id');
    const historyTitleEnInput = document.getElementById('history-title-en');
    const historyTextIdInput = document.getElementById('history-text-id');
    const historyTextEnInput = document.getElementById('history-text-en');
    const historySortOrderInput = document.getElementById('history-sort-order');
    const saveHistoryBtn = document.getElementById('save-history-btn');
    const modalCloseBtn = historyModal.querySelector('.modal-close-btn');

    // Real-time listener for history items
    db.collection('history').orderBy('sort_order').onSnapshot(snapshot => {
        historyTableBody.innerHTML = '';
        if (snapshot.empty) {
            historyTableBody.innerHTML = `<tr><td colspan="5" style="text-align: center;">No history items found.</td></tr>`;
        } else {
            snapshot.docs.forEach(doc => {
                const item = doc.data();
                const row = historyTableBody.insertRow();
                row.innerHTML = `
                    <td>${item.year}</td>
                    <td>${item.title_id || 'N/A'}</td>
                    <td>${item.title_en || 'N/A'}</td>
                    <td>${item.sort_order}</td>
                    <td>
                        <button class="btn btn-edit" data-id="${doc.id}"><i class="fas fa-edit"></i></button>
                        <button class="btn btn-delete" data-id="${doc.id}"><i class="fas fa-trash-alt"></i></button>
                    </td>
                `;
            });
        }
        hideSpinner();
    }, error => {
        console.error("Error fetching history items: ", error);
        showToast("Failed to load history items.", 'error');
        hideSpinner();
    });

    // Open Add History Modal
    addHistoryBtn.addEventListener('click', () => {
        historyForm.reset();
        historyIdInput.value = '';
        historyModalTitle.textContent = 'Add New History Item';
        showModal(historyModal);
    });

    // Close Modal
    modalCloseBtn.addEventListener('click', () => {
        hideModal(historyModal);
    });
    historyModal.addEventListener('click', (e) => {
        if (e.target === historyModal) {
            hideModal(historyModal);
        }
    });

    // Handle Edit/Delete actions (delegated listener)
    historyTableBody.addEventListener('click', async (e) => {
        const id = e.target.closest('button')?.dataset.id;
        if (!id) return;

        if (e.target.closest('.btn-edit')) {
            showSpinner();
            const doc = await db.collection('history').doc(id).get();
            if (doc.exists) {
                const item = doc.data();
                historyIdInput.value = doc.id;
                historyYearInput.value = item.year;
                historyTitleIdInput.value = item.title_id || '';
                historyTitleEnInput.value = item.title_en || '';
                historyTextIdInput.value = item.text_id || '';
                historyTextEnInput.value = item.text_en || '';
                historySortOrderInput.value = item.sort_order;

                historyModalTitle.textContent = 'Edit History Item';
                showModal(historyModal);
            } else {
                showToast("History item not found!", 'error');
            }
            hideSpinner();
        } else if (e.target.closest('.btn-delete')) {
            if (confirm('Are you sure you want to delete this history item?')) {
                showSpinner();
                try {
                    await db.collection('history').doc(id).delete();
                    showToast("History item deleted successfully!", 'success');
                } catch (error) {
                    console.error("Error deleting history item: ", error);
                    showToast(`Failed to delete history item: ${error.message}`, 'error');
                } finally {
                    hideSpinner();
                }
            }
        }
    });

    // Handle History Form Submission
    historyForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        saveHistoryBtn.disabled = true;
        showSpinner();

        const id = historyIdInput.value;
        const year = parseInt(historyYearInput.value);
        const title_id = historyTitleIdInput.value.trim();
        const title_en = historyTitleEnInput.value.trim();
        const text_id = historyTextIdInput.value.trim();
        const text_en = historyTextEnInput.value.trim();
        const sort_order = parseInt(historySortOrderInput.value);

        if (isNaN(year) || isNaN(sort_order) || !title_id || !title_en) {
            showToast("Please fill all required fields correctly.", 'error');
            saveHistoryBtn.disabled = false;
            hideSpinner();
            return;
        }

        const historyData = {
            year,
            title_id,
            title_en,
            text_id,
            text_en,
            sort_order,
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        };

        try {
            if (id) {
                await db.collection('history').doc(id).update(historyData);
                showToast("History item updated successfully!", 'success');
            } else {
                await db.collection('history').add(historyData);
                showToast("History item added successfully!", 'success');
            }
            hideModal(historyModal);
        } catch (error) {
            console.error("Error saving history item: ", error);
            showToast(`Failed to save history item: ${error.message}`, 'error');
        } finally {
            saveHistoryBtn.disabled = false;
            hideSpinner();
        }
    });
}
