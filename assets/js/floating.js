'use strict';

// Fungsi ini akan dipanggil dari main.js setelah data dari Firebase dimuat
function setupFloatingButton() {
    // --- DOM Elements ---
    const fabContainer = document.querySelector('.ls-fab-container');
    const fabMainBtn = document.querySelector('.ls-fab-main');
    const dineInBtn = document.getElementById('fab-dine-in');
    const directionBtn = document.getElementById('fab-direction');
    const whatsappBtn = document.getElementById('fab-whatsapp');

    // Dine In Modal Elements
    const dineInModal = document.getElementById('ls-dine-in-modal');
    const closeDineInBtn = document.getElementById('ls-dine-in-close-btn');
    const customerNameInput = document.getElementById('customer-name');
    const reservationDateInput = document.getElementById('reservation-date');
    const reservationTimeInput = document.getElementById('reservation-time');
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
    const setMinDateForInput = () => {
        const today = new Date();
        const yyyy = today.getFullYear();
        const mm = String(today.getMonth() + 1).padStart(2, '0');
        const dd = String(today.getDate()).padStart(2, '0');
        reservationDateInput.min = `${yyyy}-${mm}-${dd}`;
    };

    const openDineInModal = () => {
        const existingReservation = JSON.parse(localStorage.getItem('reservation'));
        if (existingReservation && existingReservation.code) {
            reservationCodeEl.textContent = existingReservation.code;
            dineInStep1.style.display = 'none';
            dineInStep2.style.display = 'block';
        } else {
            dineInStep1.style.display = 'block';
            dineInStep2.style.display = 'none';
            customerNameInput.value = '';
            reservationDateInput.value = '';
            reservationTimeInput.value = '';
            setMinDateForInput();
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
        const date = new Date();
        const year = date.getFullYear().toString().slice(-2);
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const randomPart = Math.random().toString(36).substring(2, 6).toUpperCase();
        return `LSB-${year}${month}-${randomPart}`;
    };

    const saveReservationToFirebase = async (reservationData) => {
        try {
            await db.collection('reservations').add(reservationData);
            console.log('Reservation saved to Firebase');
        } catch (error) {
            console.error("Error saving reservation to Firebase: ", error);
            alert("Failed to save reservation to our system. Please check console for details.");
            throw error; // Lempar error agar bisa ditangkap
        }
    };

    generateCodeBtn.addEventListener('click', async () => {
        const customerName = customerNameInput.value.trim();
        const reservationDate = reservationDateInput.value;
        const reservationTime = reservationTimeInput.value;

        if (!customerName || !reservationDate || !reservationTime) {
            alert("Please complete all fields: Name, Date, and Time.");
            return;
        }

        const code = generateReservationCode();
        
        const reservationData = {
            code: code,
            name: customerName,
            reservationDate: reservationDate,
            reservationTime: reservationTime,
            status: 'pending', // Status awal reservasi
            createdAt: new Date()
        };
        
        try {
            await saveReservationToFirebase(reservationData);
            localStorage.setItem('reservation', JSON.stringify({ code: code, name: customerName }));
            reservationCodeEl.textContent = code;
            dineInStep1.style.display = 'none';
            dineInStep2.style.display = 'block';
        } catch (error) {
            console.log("UI update aborted due to Firebase save failure.");
        }
    });

    cancelCodeBtn.addEventListener('click', () => {
        if (confirm("Are you sure you want to cancel this code and make a new reservation?")) {
            localStorage.removeItem('reservation');
            dineInStep2.style.display = 'none';
            dineInStep1.style.display = 'block';
            customerNameInput.value = '';
            reservationDateInput.value = '';
            reservationTimeInput.value = '';
            setMinDateForInput();
        }
    });

    // --- GET DIRECTION LOGIC (FIXED) ---
    const latitude = -8.6716371;  // FIX: Menggunakan tanda minus (-) yang benar
    const longitude = 115.16241;
    // FIX: Menggunakan format URL Google Maps yang valid
    directionBtn.href = `https://maps.google.com/?q=${latitude},${longitude}`;

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
