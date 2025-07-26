import { initializeApp } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-app.js";
import { getDatabase, ref, onValue, get, push, serverTimestamp } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-database.js";
import { getAuth, onAuthStateChanged, GoogleAuthProvider, signInWithPopup, signOut } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-auth.js";

const firebaseConfig = { /* ... Konfigurasi Firebase Anda ... */ };
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const auth = getAuth(app);

let map, marker, currentUser;

// Fungsi ini dipanggil oleh Google Maps API setelah script-nya termuat
window.initMap = function() {
  const bali = { lat: -8.7192, lng: 115.1686 };
  map = new google.maps.Map(document.getElementById("map"), {
    center: bali,
    zoom: 15,
  });
  marker = new google.maps.Marker({ map: map, position: bali, draggable: true });
  
  marker.addListener('dragend', () => {
    updateAddress(marker.getPosition());
  });
  updateAddress(bali);
};

function updateAddress(location) {
    const geocoder = new google.maps.Geocoder();
    geocoder.geocode({ location: location }, (results, status) => {
        if (status === "OK" && results[0]) {
            document.getElementById('delivery-address').textContent = results[0].formatted_address;
        } else {
            document.getElementById('delivery-address').textContent = "Alamat tidak ditemukan.";
        }
    });
}

document.addEventListener('DOMContentLoaded', () => {
    // --- AUTHENTICATION ---
    const loginBtn = document.getElementById('login-btn');
    const logoutBtn = document.getElementById('logout-btn');
    const userAuthContainer = document.getElementById('user-auth-container');
    const userInfo = document.getElementById('user-info');
    
    loginBtn.addEventListener('click', () => {
        const provider = new GoogleAuthProvider();
        signInWithPopup(auth, provider);
    });
    logoutBtn.addEventListener('click', () => signOut(auth));

    onAuthStateChanged(auth, user => {
        currentUser = user;
        if (user) {
            loginBtn.classList.add('hidden');
            userInfo.classList.remove('hidden');
            document.getElementById('user-avatar').src = user.photoURL;
        } else {
            loginBtn.classList.remove('hidden');
            userInfo.classList.add('hidden');
        }
    });

    // --- MODAL & PEMESANAN ---
    const orderModal = document.getElementById('order-modal');
    const menuGrid = document.getElementById('menu-grid-container');
    
    menuGrid.addEventListener('click', e => {
        const card = e.target.closest('.menu-card');
        if (card) {
            if (!currentUser) {
                alert("Silakan login terlebih dahulu untuk memesan.");
                return;
            }
            openOrderModal(card.dataset.productId);
        }
    });

    orderModal.querySelector('.modal-close-btn').onclick = () => orderModal.classList.add('hidden');
    
    document.getElementById('confirm-order-btn').addEventListener('click', function() {
        const productId = this.dataset.productId;
        const address = document.getElementById('delivery-address').textContent;
        
        const orderData = {
            userId: currentUser.uid,
            userEmail: currentUser.email,
            productId: productId,
            deliveryAddress: address,
            status: 'new',
            timestamp: serverTimestamp()
        };
        
        push(ref(db, `orders`), orderData)
            .then(() => {
                alert('Pesanan berhasil dibuat! Tim kami akan segera menghubungi Anda.');
                orderModal.classList.add('hidden');
            })
            .catch(err => alert(`Gagal membuat pesanan: ${err.message}`));
    });

    // ... (kode untuk load slider, menu, dll tetap sama)
});

function openOrderModal(productId) {
    const productRef = ref(db, `products/${productId}`);
    get(productRef).then(snapshot => {
        if (snapshot.exists()) {
            const product = snapshot.val();
            document.getElementById('modal-item-name').textContent = product.name_en;
            document.getElementById('confirm-order-btn').dataset.productId = productId;
            document.getElementById('order-modal').classList.remove('hidden');
            // Re-initialize map jika perlu
            if (window.google) initMap();
        }
    });
}
