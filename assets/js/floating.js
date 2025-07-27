'use strict';

// Fungsi ini akan dipanggil dari main.js setelah data dari Firebase dimuat
function setupFloatingButton() {
    // DOM Elements for FAB
    const fabContainer = document.querySelector('.ls-fab-container');
    const fabMainBtn = document.querySelector('.ls-fab-main');
    
    // Buttons in the menu
    const atTableBtn = document.getElementById('fab-at-table');
    const reservationBtn = document.getElementById('fab-reservation');
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
    
    // 1a. "Sudah Di Meja" -> Scroll to Menu Section
    atTableBtn.addEventListener('click', (e) => {
        e.preventDefault();
        const menuSection = document.getElementById('menu');
        if (menuSection) {
            menuSection.scrollIntoView({ behavior: 'smooth' });
        }
        fabContainer.classList.remove('active'); // Close FAB menu
    });

    // 1b. "Reservasi" -> Chat to WhatsApp with specific message
    // Logika ini digabung dengan Chat Admin di bawah karena tujuannya sama

    // --- LOGIKA POINT 2: GET DIRECTION ---
    const latitude = -8.7222;  // Ganti dengan latitude restoran Anda
    const longitude = 115.1682; // Ganti dengan longitude restoran Anda
    const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`;
    directionBtn.href = mapsUrl;


    // --- LOGIKA POINT 3: CHAT ADMIN (DAN RESERVASI) ---
    // Mengambil nomor telepon dari database
    const rawPhoneNumber = siteData.content?.footer_phone_value?.text_id || '6281234567890';
    // Membersihkan nomor telepon (menghilangkan spasi, +, -) dan memastikan diawali 62
    let cleanPhoneNumber = rawPhoneNumber.replace(/[\s+-]/g, '');
    if (cleanPhoneNumber.startsWith('08')) {
        cleanPhoneNumber = '62' + cleanPhoneNumber.substring(1);
    }
    
    // Membuat pesan bilingual
    const generalGreeting_ID = "Halo Lobster Shack Bali, saya ingin bertanya...";
    const generalGreeting_EN = "Hello Lobster Shack Bali, I'd like to ask...";
    const reservationGreeting_ID = "Halo Lobster Shack Bali, saya ingin melakukan reservasi meja.";
    const reservationGreeting_EN = "Hello Lobster Shack Bali, I would like to make a reservation.";

    const encodedGeneralMessage = encodeURIComponent(`${generalGreeting_ID}\n\n${generalGreeting_EN}`);
    const encodedReservationMessage = encodeURIComponent(`${reservationGreeting_ID}\n\n${reservationGreeting_EN}`);

    // Set link untuk tombol
    whatsappBtn.href = `https://wa.me/${cleanPhoneNumber}?text=${encodedGeneralMessage}`;
    reservationBtn.href = `https://wa.me/${cleanPhoneNumber}?text=${encodedReservationMessage}`;
}
