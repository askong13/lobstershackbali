// auth.js
const auth = firebase.auth();
const loginForm = document.getElementById('login-form');
const loginEmailInput = document.getElementById('login-email');
const loginPasswordInput = document.getElementById('login-password');
const authErrorMessage = document.getElementById('auth-error-message');
const adminPanel = document.getElementById('admin-panel');
const authContainer = document.getElementById('auth-container');
const logoutBtn = document.getElementById('logout-btn');

auth.onAuthStateChanged(user => {
    if (user) {
        // User is signed in, show admin panel
        authContainer.style.display = 'none';
        adminPanel.style.display = 'flex'; // Assuming flex layout for sidebar + main
        // Redirect to dashboard or default section
        window.location.hash = '#dashboard';
        loadSection('dashboard');
    } else {
        // User is signed out, show login form
        authContainer.style.display = 'block';
        adminPanel.style.display = 'none';
    }
    hideSpinner();
});

if (loginForm) {
    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        showSpinner();
        const email = loginEmailInput.value;
        const password = loginPasswordInput.value;

        auth.signInWithEmailAndPassword(email, password)
            .then((userCredential) => {
                // Signed in
                authErrorMessage.textContent = '';
                // The onAuthStateChanged listener will handle UI update
            })
            .catch((error) => {
                authErrorMessage.textContent = error.message;
                hideSpinner();
            });
    });
}

if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
        auth.signOut()
            .then(() => {
                showToast("Logged out successfully!", 'success');
                window.location.hash = ''; // Clear hash
            })
            .catch((error) => {
                showToast(`Logout failed: ${error.message}`, 'error');
            });
    });
}

// Example for creating an admin user (run once in browser console after logging in)
// firebase.auth().createUserWithEmailAndPassword("admin@example.com", "your_strong_password")
// .then((userCredential) => console.log("Admin user created:", userCredential.user))
// .catch((error) => console.error("Error creating admin:", error));
