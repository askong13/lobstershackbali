// File ini akan menangani logika untuk login.html dan register.html

document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');

    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }

    if (registerForm) {
        registerForm.addEventListener('submit', handleRegister);
    }
});

/**
 * Menangani proses login pengguna.
 */
async function handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    const messageContainer = document.getElementById('form-message');

    // Tampilkan pesan loading (opsional)
    messageContainer.textContent = 'Mencoba login...';
    messageContainer.classList.remove('hidden', 'error');

    try {
        const response = await fetch('/api/user-login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message || 'Login gagal.');
        }

        // Jika login berhasil, Firebase Auth SDK di sisi klien akan secara
        // otomatis mendeteksi status login. Kita bisa langsung redirect.
        alert('Login berhasil! Anda akan diarahkan ke halaman utama.');
        window.location.href = '/';

    } catch (error) {
        showMessage(error.message, true);
    }
}

/**
 * Menangani proses registrasi pengguna baru.
 */
async function handleRegister(e) {
    e.preventDefault();
    const name = document.getElementById('reg-name').value;
    const email = document.getElementById('reg-email').value;
    const phone = document.getElementById('reg-phone').value;
    const password = document.getElementById('reg-password').value;

    try {
        const response = await fetch('/api/user-register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, phone, password }),
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message || 'Registrasi gagal.');
        }

        // Jika registrasi berhasil, redirect ke halaman login
        alert('Registrasi berhasil! Silakan login dengan akun Anda.');
        window.location.href = '/login.html';

    } catch (error) {
        showMessage(error.message, true);
    }
}

/**
 * Menampilkan pesan di UI, baik itu pesan sukses atau error.
 * @param {string} text - Teks pesan yang akan ditampilkan.
 * @param {boolean} isError - Tandai true jika ini adalah pesan error.
 */
function showMessage(text, isError = false) {
    const messageContainer = document.getElementById('form-message');
    if (!messageContainer) return;
    
    messageContainer.textContent = text;
    messageContainer.classList.toggle('error', isError);
    messageContainer.classList.remove('hidden');
}
