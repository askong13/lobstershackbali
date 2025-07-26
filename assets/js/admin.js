import { initializeApp } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-app.js";
import { getDatabase, ref, onValue, query, orderByChild, equalTo } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-database.js";
import { getAuth, onAuthStateChanged, GoogleAuthProvider, signInWithPopup, signOut } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-auth.js";
// ... (import lainnya jika ada)

const firebaseConfig = { /* ... Konfigurasi Firebase Anda ... */ };
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const auth = getAuth(app);

// --- AUTH & UI LOGIC ---
// ... (kode login/logout admin via Google sama seperti sebelumnya)

function initAdminPanel() {
    // ... (kode navigasi tab admin sama seperti sebelumnya)
    listenForNewOrders();
}

// --- NOTIFIKASI PESANAN BARU ---
function listenForNewOrders() {
    const ordersRef = query(ref(db, 'orders'), orderByChild('status'), equalTo('new'));
    const notificationBadge = document.getElementById('order-notification');
    
    onValue(ordersRef, (snapshot) => {
        const newOrdersCount = snapshot.size;
        if (newOrdersCount > 0) {
            notificationBadge.textContent = newOrdersCount;
            notificationBadge.classList.remove('hidden');
            // Optional: Mainkan suara notifikasi
            // new Audio('/assets/notification.mp3').play();
        } else {
            notificationBadge.classList.add('hidden');
        }
    });

    // Muat daftar semua pesanan
    loadAllOrders();
}

function loadAllOrders() {
    const ordersListContainer = document.getElementById('orders-list');
    const allOrdersRef = ref(db, 'orders');
    
    onValue(allOrdersRef, (snapshot) => {
        ordersListContainer.innerHTML = '<table>...<thead>...</thead><tbody></tbody></table>';
        const tbody = ordersListContainer.querySelector('tbody');
        if (snapshot.exists()) {
            snapshot.forEach(childSnapshot => {
                const order = childSnapshot.val();
                const tr = document.createElement('tr');
                // Tampilkan detail pesanan di sini
                tr.innerHTML = `<td>${order.userEmail}</td><td>${order.deliveryAddress}</td><td>${order.status}</td>`;
                tbody.prepend(tr); // Pesanan baru di atas
            });
        }
    });
}
