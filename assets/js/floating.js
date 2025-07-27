'use strict';

// Fungsi ini akan dipanggil dari main.js setelah data dari Firebase dimuat
function setupFloatingButton() {
    // --- DOM Elements ---
    const fabContainer = document.querySelector('.ls-fab-container');
    const fabMainBtn = document.querySelector('.ls-fab-main');
    const dineInBtn = document.getElementById('fab-dine-in');
    const directionBtn = document.getElementById('fab-direction');
    const whatsappBtn = document.getElementById('fab-whatsapp');

    const dineInModal = document.getElementById('ls-dine-in-modal');
    const closeDineInBtn = document.getElementById('ls-dine-in-close-btn');
    const customerNameInput = document.getElementById('customer-name');
    const currentDateEl = document.getElementById('current-date');
    const currentTimeEl = document.getElementById('current-time');
    const generateCodeBtn = document.getElementById('generate-code-btn');
    const cancelCodeBtn = document.getElementById('cancel-code-btn');
    const dineInStep1 = document.getElementById('dine-in-step-1');
    const dineInStep2 = document.getElementById('dine-in-step-2');
    const reservationCodeEl = document.getElementById('reservation-code');

    if (!fabContainer || !siteData.content || !db) {
        console.error("FAB dependencies not found (container, siteData, or db). Cannot initialize.");
        return;
    }

    // --- Main FAB Toggle ---
    fabMainBtn.addEventListener('click', () => {
        fabContainer.classList.toggle('active');
    });

    // --- DINE IN POPUP LOGIC ---
    const openDineInModal = () => {
        // Cek apakah sudah ada kode di local storage
        const existingReservation = JSON.parse(localStorage.getItem('reservation'));
        if (existingReservation && existingReservation.code) {
            // Jika ada, langsung tampilkan step 2
            customerNameInput.value = existingReservation.name;
            reservationCodeEl.textContent = existingReservation.code;
            dineInStep1.style.display = 'none';
            dineInStep2.style.display = 'block';
        } else {
            // Jika tidak ada, tampilkan step 1
            const now = new Date();
            currentDateEl.textContent = now.toLocaleDateString('en-GB'); // Format DD/MM/YYYY
            currentTimeEl.textContent = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
            dineInStep1.style.display = 'block';
            dineInStep2.style.display = 'none';
            customerNameInput.value = '';
        }
        dineInModal.classList.add('visible');
    };
    const closeDineInModal = () => dineInModal.classList.remove('visible');

    dineInBtn.addEventListener('click', (e) => {
        e.preventDefault();
        openDineInModal();
        fabContainer.classList.remove('active');
    });
    closeDineInBtn.addEventListener('click', closeDineInModal);
    dineInModal.addEventListener('click', (e) => {
        if (e.target === dineInModal) closeDineInModal();
    });

    // --- RESERVATION CODE LOGIC ---
    const generateReservationCode = () => {
        const now = new Date();
        const year = now.getFullYear().toString().slice(-2);
        const month = (now.getMonth() + 1).toString().padStart(2, '0');
        const day = now.getDate().toString().padStart(2, '0');
        const randomPart = Math.random().toString(36).substring(2, 6).toUpperCase();
        return `LSB-${year}${month}${day}-${randomPart}`;
    };

    const saveReservationToFirebase = async (reservationData) => {
        try {
            await db.collection('reservations').add(reservationData);
            console.log('Reservation saved to Firebase');
        } catch (error) {
            console.error("Error saving reservation to Firebase: ", error);
            alert("Failed to save reservation to our system. Please try again.");
        }
    };

    generateCodeBtn.addEventListener('click', () => {
        const customerName = customerNameInput.value.trim();
        if (!customerName) {
            alert("Please enter your name.");
            return;
        }

        const code = generateReservationCode();
        const reservationTime = new Date();
        
        const reservationData = {
            code: code,
            name: customerName,
            date: reservationTime.toLocaleDateString('en-GB'),
            time: reservationTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
            createdAt: firebase.firestore.FieldValue.serverTimestamp() // Requires firebase global
        };

        // Save to Local Storage
        localStorage.setItem('reservation', JSON.stringify(reservationData));
        
        // Save to Firebase
        saveReservationToFirebase(reservationData);

        // Update UI
        reservationCodeEl.textContent = code;
        dineInStep1.style.display = 'none';
        dineInStep2.style.display = 'block';
    });

    cancelCodeBtn.addEventListener('click', () => {
        if (confirm("Are you sure you want to cancel this code and generate a new one?")) {
            localStorage.removeItem('reservation');
            // Reset UI
            dineInStep2.style.display = 'none';
            dineInStep1.style.display = 'block';
            customerNameInput.value = ''; // Clear name input
        }
    });

    // --- GET DIRECTION LOGIC ---
    const latitude = -8.7222;
    const longitude = 115.1682;
    directionBtn.href = `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;

    // --- WHATSAPP CHAT LOGIC ---
    const rawPhoneNumber = siteData.content?.footer_phone_value?.text_id || '6281234567890';
    let cleanPhoneNumber = rawPhoneNumber.replace(/[\s+-]/g, '');
    if (cleanPhoneNumber.startsWith('0')) {
        cleanPhoneNumber = '62' + cleanPhoneNumber.substring(1);
    }
    const greetingMessage = "Hello Lobster Shack Bali, I would like to make an inquiry.";
    const encodedMessage = encodeURIComponent(greetingMessage);
    whatsappBtn.href = `https://wa.me/${cleanPhoneNumber}?text=${encodedMessage}`;
}

