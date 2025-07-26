import { signInWithEmailAndPassword } from "firebase/auth";
import { ref, get } from "firebase/database";
import { auth, db } from "./firebase-config.js";
import jwt from 'jsonwebtoken'; // Anda perlu `npm install jsonwebtoken`

// Kunci rahasia untuk token. Simpan ini di Netlify Environment Variables dengan nama JWT_SECRET
const JWT_SECRET = process.env.JWT_SECRET;

export const handler = async (event) => {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }
    
    try {
        const { email, password } = JSON.parse(event.body);

        // 1. Coba login dengan kredensial yang diberikan
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // 2. Verifikasi apakah pengguna adalah admin di database
        const adminRef = ref(db, `authorized_admins/${user.uid}`);
        const snapshot = await get(adminRef);

        if (!snapshot.exists()) {
            // Jika bukan admin, tolak akses
            return {
                statusCode: 403, // Forbidden
                body: JSON.stringify({ message: 'Akses ditolak. Anda bukan admin.' }),
            };
        }

        // 3. Jika admin, buat token sesi yang aman (berlaku 8 jam)
        const token = jwt.sign({ uid: user.uid, role: 'admin' }, JWT_SECRET, { expiresIn: '8h' });

        return {
            statusCode: 200,
            body: JSON.stringify({ message: 'Login admin berhasil.', token: token }),
        };

    } catch (error) {
        // Tangani jika email/password salah
        if (error.code === 'auth/invalid-credential') {
            return { statusCode: 401, body: JSON.stringify({ message: 'Email atau password salah.' }) };
        }
        return { statusCode: 500, body: JSON.stringify({ message: 'Terjadi kesalahan pada server.' }) };
    }
};
