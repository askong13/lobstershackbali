'use strict';

// Fungsi ini akan dipanggil dari main.js setelah data dari Firebase dimuat
function setupFloatingButton() {
    // DOM Elements for FAB
    const fabContainer = document.querySelector('.ls-fab-container');
    const fabMainBtn = document.querySelector('.ls-fab-main');
    
    // Buttons in the menu
    const dineInBtn = document.getElementById('fab-dine-in');
    const directionBtn = document.getElementById('fab-direction');
    const whatsappBtn = document.getElementById('fab-whatsapp');

    if (!fabContainer || !siteData.content) {
        console.error("FAB container or site data not found. Cannot initialize FAB.");
        return;
    }

    // --- Main FAB Toggle ---
    fabMainBtn.addEventListener('click', () => {
        fabContainer.classList.toggle('active');
    });

    // --- LOGIKA POINT 1: DINE IN ---
    /**
     * Menghasilkan kode reservasi unik berdasarkan waktu.
     * Format: LSB-YYMMDD-HHMMSS
     * Contoh: LSB-250728-093015
     */
    const generateReservationCode = () => {
        const now = new Date();
        const year = now.getFullYear().toString().slice(-2);
        const month = (now.getMonth() + 1).toString().padStart(2, '0');
        const day = now.getDate().toString().padStart(2, '0');
        const hours = now.getHours().toString().padStart(2, '0');
        const minutes = now.getMinutes().toString().padStart(2, '0');
        const seconds = now.getSeconds().toString().padStart(2, '0');
        
        return `LSB-${year}${month}${day}-${hours}${minutes}${seconds}`;
    };

    dineInBtn.addEventListener('click', (e) => {
        e.preventDefault();
        const reservationCode = generateReservationCode();
        
        // Menampilkan kode kepada pengguna menggunakan alert sederhana
        alert(`Your Reservation Code is: ${reservationCode}\nPlease show this code to our staff.`);
        
        fabContainer.classList.remove('active'); // Tutup menu FAB setelah diklik
    });


    // --- LOGIKA POINT 2: GET DIRECTION (FIXED) ---
    const latitude = -8.7222;  // Ganti dengan latitude restoran Anda
    const longitude = 115.1682; // Ganti dengan longitude restoran Anda
    
    // URL Google Maps yang benar untuk navigasi dari lokasi pengguna
    const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`;
    directionBtn.href = mapsUrl;


    // --- LOGIKA POINT 3: CHAT ADMIN (ENGLISH ONLY) ---
    // Mengambil nomor telepon dari database
    const rawPhoneNumber = siteData.content?.footer_phone_value?.text_id || '6281234567890';
    
    // Membersihkan nomor telepon dan memastikan diawali dengan 62
    let cleanPhoneNumber = rawPhoneNumber.replace(/[\s+-]/g, '');
    if (cleanPhoneNumber.startsWith('0')) {
        cleanPhoneNumber = '62' + cleanPhoneNumber.substring(1);
    }
    
    // Pesan sapaan dalam bahasa Inggris
    const greetingMessage = "Hello Lobster Shack Bali, I would like to make an inquiry.";
    const encodedMessage = encodeURIComponent(greetingMessage);

    // Set link untuk tombol WhatsApp
    whatsappBtn.href = `https://wa.me/${cleanPhoneNumber}?text=${encodedMessage}`;
}
