import { createUserWithEmailAndPassword } from "firebase/auth";
import { ref, set } from "firebase/database";
import { auth, db } from './firebase-config.js';

export const handler = async (event, context) => {
    // Pastikan ini adalah request POST
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    try {
        const { name, email, phone, password } = JSON.parse(event.body);

        // Validasi input sederhana
        if (!name || !email || !password || !phone) {
            return {
                statusCode: 400,
                body: JSON.stringify({ message: 'Semua kolom wajib diisi.' }),
            };
        }

        // 1. Buat pengguna di Firebase Authentication
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // 2. Simpan data profil tambahan di Realtime Database
        await set(ref(db, `users/${user.uid}/profile`), {
            name: name,
            email: email,
            phone: phone,
            createdAt: new Date().toISOString(),
        });

        return {
            statusCode: 201, // 201 Created
            body: JSON.stringify({
                message: "Pengguna berhasil dibuat.",
                uid: user.uid,
            }),
        };
    } catch (error) {
        // Tangani error umum dari Firebase, seperti email sudah digunakan
        let errorMessage = "Terjadi kesalahan saat registrasi.";
        if (error.code === 'auth/email-already-in-use') {
            errorMessage = 'Email ini sudah terdaftar. Silakan gunakan email lain.';
        }
        
        console.error("Registration Error:", error);
        return {
            statusCode: 500,
            body: JSON.stringify({ message: errorMessage }),
        };
    }
};
