document.addEventListener('DOMContentLoaded', () => {
    const reservationForm = document.getElementById('reservation-form');
    if (reservationForm) {
        reservationForm.addEventListener('submit', handleReservation);
    }
});

async function handleReservation(e) {
    e.preventDefault();
    const formData = {
        name: document.getElementById('res-name').value,
        email: document.getElementById('res-email').value,
        phone: document.getElementById('res-phone').value,
        date: document.getElementById('res-date').value,
        time: document.getElementById('res-time').value,
        guests: parseInt(document.getElementById('res-guests').value, 10),
    };

    showMessage('Mengirim reservasi...', false);

    try {
        const response = await fetch('/api/submit-reservation', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData),
        });

        const result = await response.json();
        if (!response.ok) {
            throw new Error(result.message || 'Gagal mengirim reservasi.');
        }

        showMessage('Reservasi Anda telah berhasil dikirim! Kami akan segera menghubungi Anda untuk konfirmasi.', false);
        e.target.reset(); // Kosongkan form setelah berhasil

    } catch (error) {
        showMessage(error.message, true);
    }
}

function showMessage(text, isError = false) {
    const messageContainer = document.getElementById('form-message');
    messageContainer.textContent = text;
    messageContainer.classList.toggle('error', isError);
    messageContainer.classList.remove('hidden');
}
