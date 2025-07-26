import { initializeApp } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-app.js";
import { getDatabase, ref, onValue } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-database.js";
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-auth.js";

// KONFIGURASI FIREBASE ANDA - SUDAH TERINTEGRASI
const firebaseConfig = {
  apiKey: "AIzaSyCIC1WLirQbsY8XDsVhMWHVv8GO2nwcyjk",
  authDomain: "lobster-shack-bali.firebaseapp.com",
  databaseURL: "https://lobster-shack-bali-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "lobster-shack-bali",
  storageBucket: "lobster-shack-bali.firebasestorage.app",
  messagingSenderId: "42452974733",
  appId: "1:42452974733:web:5cad780f8295edd2b5f6c4"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const auth = getAuth(app);

// --- ELEMEN DOM ---
const loginContainer = document.getElementById('login-container');
const adminDashboard = document.getElementById('admin-dashboard');
const loginForm = document.getElementById('login-form');
const loginError = document.getElementById('login-error');
const adminUserEmail = document.getElementById('admin-user-email');
const logoutBtn = document.getElementById('logout-btn');

// --- LOGIKA LOGIN ---
loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = loginForm['admin-email'].value;
    const password = loginForm['admin-password'].value;

    signInWithEmailAndPassword(auth, email, password)
        .catch((error) => {
            loginError.textContent = error.message;
            loginError.classList.remove('hidden');
        });
});

// --- LOGIKA LOGOUT ---
logoutBtn.addEventListener('click', () => {
    signOut(auth);
});

// --- CEK STATUS AUTENTIKASI ---
onAuthStateChanged(auth, (user) => {
    if (user) {
        // Pengguna login
        loginContainer.classList.add('hidden');
        adminDashboard.classList.remove('hidden');
        adminUserEmail.textContent = user.email;
        loadReservations();
    } else {
        // Pengguna logout
        loginContainer.classList.remove('hidden');
        adminDashboard.classList.add('hidden');
    }
});

// --- MEMUAT DATA UNTUK ADMIN ---
function loadReservations() {
    const reservationsRef = ref(db, 'reservations');
    const tbody = document.getElementById('reservations-tbody');
    
    onValue(reservationsRef, (snapshot) => {
        tbody.innerHTML = '';
        if (snapshot.exists()) {
            const reservations = snapshot.val();
            for (const key in reservations) {
                const r = reservations[key];
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${new Date(r.createdAt).toLocaleDateString('id-ID')}</td>
                    <td>${r.name}</td>
                    <td>${r.email}</td>
                    <td>${r.phone}</td>
                    <td>${r.guests}</td>
                    <td>${r.status}</td>
                `;
                tbody.appendChild(tr);
            }
        } else {
            tbody.innerHTML = '<tr><td colspan="6">Belum ada reservasi.</td></tr>';
        }
    });
}
