import { signInWithEmailAndPassword } from "firebase/auth";
import { ref, get } from "firebase/database";
import { auth, db } from "./firebase-config.js";
import jwt from 'jsonwebtoken'; // Anda perlu `npm install jsonwebtoken`

// Kunci rahasia untuk menandatangani token JWT. Simpan ini di Netlify Environment Variables!
// Nama variabel: JWT_SECRET
const JWT_SECRET = process.env.JWT_SECRET;

export const handler = async (event) => {
    if (event.httpMethod !== 'POST') return { statusCode: 405 };
    
    try {
        const { email, password } = JSON.parse(event.body);

        // 1. Coba login dengan email dan password
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // 2. Cek apakah UID pengguna terdaftar sebagai admin di database
        const adminRef = ref(db, `authorized_admins/${user.uid}`);
        const snapshot = await get(adminRef);

        if (!snapshot.exists()) {
            // Jika tidak ada, tolak akses meskipun login berhasil
            return {
                statusCode: 403, // Forbidden
                body: JSON.stringify({ message: 'Akses ditolak. Anda bukan admin.' }),
            };
        }

        // 3. Jika dia admin, buat token JWT yang aman
        const token = jwt.sign({ uid: user.uid, role: 'admin' }, JWT_SECRET, { expiresIn: '8h' });

        return {
            statusCode: 200,
            body: JSON.stringify({ message: 'Login admin berhasil.', token: token }),
        };

    } catch (error) {
        // Tangani jika email/password salah
        if (error.code === 'auth/wrong-password' || error.code === 'auth/user-not-found') {
            return { statusCode: 401, body: JSON.stringify({ message: 'Email atau password salah.' }) };
        }
        return { statusCode: 500, body: JSON.stringify({ message: 'Terjadi kesalahan server.' }) };
    }
};
