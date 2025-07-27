// admin/js/content.js
const contentSection = document.getElementById('content-section');
let contentModal; // Will be defined when loadContent is called

async function loadContent() {
    showSpinner();
    contentSection.innerHTML = `
        <h2>Static Content Management (ID & EN)</h2>
        <p style="margin-bottom: 20px; color: var(--text-light-color);">
            Manage translatable text content for the main website. Each item has an Indonesian and English version.
        </p>
        <div class="table-responsive">
            <table class="admin-table">
                <thead>
                    <tr>
                        <th>Content Key</th>
                        <th>Text (ID)</th>
                        <th>Text (EN)</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody id="content-table-body">
                    </tbody>
            </table>
        </div>

        <div id="content-modal" class="modal-overlay">
            <div class="modal-content">
                <div class="modal-header">
                    <h3 id="content-modal-title">Edit Content</h3>
                    <button class="modal-close-btn">&times;</button>
                </div>
                <div class="modal-body">
                    <form id="content-form">
                        <input type="hidden" id="content-id">
                        <div class="form-group">
                            <label for="content-key">Content Key (Not Editable)</label>
                            <input type="text" id="content-key" readonly>
                        </div>
                        <div class="form-group">
                            <label for="content-text-id">Text (Indonesian)</label>
                            <textarea id="content-text-id" rows="3" required></textarea>
                        </div>
                        <div class="form-group">
                            <label for="content-text-en">Text (English)</label>
                            <textarea id="content-text-en" rows="3" required></textarea>
                        </div>
                        <button type="submit" class="btn btn-primary" id="save-content-btn">Save Content</button>
                    </form>
                </div>
            </div>
        </div>
    `;

    const contentTableBody = document.getElementById('content-table-body');
    contentModal = document.getElementById('content-modal');
    const contentModalTitle = document.getElementById('content-modal-title');
    const contentForm = document.getElementById('content-form');
    const contentIdInput = document.getElementById('content-id');
    const contentKeyInput = document.getElementById('content-key');
    const contentTextIdInput = document.getElementById('content-text-id');
    const contentTextEnInput = document.getElementById('content-text-en');
    const saveContentBtn = document.getElementById('save-content-btn');
    const modalCloseBtn = contentModal.querySelector('.modal-close-btn');

    // Real-time listener for content items
    db.collection('content').onSnapshot(snapshot => {
        contentTableBody.innerHTML = '';
        if (snapshot.empty) {
            contentTableBody.innerHTML = `<tr><td colspan="4" style="text-align: center;">No content items found.</td></tr>`;
        } else {
            snapshot.docs.forEach(doc => {
                const content = doc.data();
                const row = contentTableBody.insertRow();
                row.innerHTML = `
                    <td><strong>${doc.id}</strong></td>
                    <td>${content.text_id || 'N/A'}</td>
                    <td>${content.text_en || 'N/A'}</td>
                    <td>
                        <button class="btn btn-edit" data-id="${doc.id}"><i class="fas fa-edit"></i></button>
                    </td>
                `;
            });
        }
        hideSpinner();
    }, error => {
        console.error("Error fetching content: ", error);
        showToast("Failed to load content.", 'error');
        hideSpinner();
    });

    // Close Modal
    modalCloseBtn.addEventListener('click', () => {
        hideModal(contentModal);
    });
    contentModal.addEventListener('click', (e) => {
        if (e.target === contentModal) {
            hideModal(contentModal);
        }
    });

    // Handle Edit action (delegated listener)
    contentTableBody.addEventListener('click', async (e) => {
        const id = e.target.closest('button')?.dataset.id;
        if (!id) return;

        if (e.target.closest('.btn-edit')) {
            showSpinner();
            const doc = await db.collection('content').doc(id).get();
            if (doc.exists) {
                const content = doc.data();
                contentIdInput.value = doc.id;
                contentKeyInput.value = doc.id; // Content Key is the Doc ID
                contentTextIdInput.value = content.text_id || '';
                contentTextEnInput.value = content.text_en || '';

                contentModalTitle.textContent = `Edit Content: ${doc.id}`;
                showModal(contentModal);
            } else {
                showToast("Content item not found!", 'error');
            }
            hideSpinner();
        }
    });

    // Handle Content Form Submission
    contentForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        saveContentBtn.disabled = true;
        showSpinner();

        const id = contentIdInput.value;
        const text_id = contentTextIdInput.value.trim();
        const text_en = contentTextEnInput.value.trim();

        if (!text_id || !text_en) {
            showToast("Both Indonesian and English text are required.", 'error');
            saveContentBtn.disabled = false;
            hideSpinner();
            return;
        }

        const contentData = {
            text_id,
            text_en,
            last_updated: firebase.firestore.FieldValue.serverTimestamp() // Add update timestamp
        };

        try {
            await db.collection('content').doc(id).update(contentData);
            showToast("Content updated successfully!", 'success');
            hideModal(contentModal);
        } catch (error) {
            console.error("Error saving content: ", error);
            showToast(`Failed to save content: ${error.message}`, 'error');
        } finally {
            saveContentBtn.disabled = false;
            hideSpinner();
        }
    });
}
