import { ref, get } from "firebase/database";
import { db } from "./firebase-config.js";
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET;

export const handler = async (event) => {
    try {
        // Ambil token dari header Authorization: "Bearer <token>"
        const authHeader = event.headers.authorization;
        if (!authHeader) {
            return { statusCode: 401, body: 'Token tidak tersedia.' };
        }
        
        const token = authHeader.split(' ')[1];
        
        // Verifikasi token. Jika tidak valid, jwt.verify akan melempar error.
        const decoded = jwt.verify(token, JWT_SECRET);

        // Cek apakah token memiliki role 'admin'
        if (decoded.role !== 'admin') {
            return { statusCode: 403, body: 'Akses ditolak.' };
        }
        
        // Jika token valid dan user adalah admin, ambil data pesanan
        const ordersRef = ref(db, 'orders');
        const snapshot = await get(ordersRef);

        if (snapshot.exists()) {
            return {
                statusCode: 200,
                body: JSON.stringify(snapshot.val()),
            };
        } else {
            return { statusCode: 200, body: JSON.stringify({}) }; // Kembalikan objek kosong jika tidak ada pesanan
        }

    } catch (error) {
        // Jika token expired atau tidak valid
        if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
            return { statusCode: 401, body: JSON.stringify({ message: 'Sesi tidak valid atau telah berakhir. Silakan login kembali.' }) };
        }
        return { statusCode: 500, body: 'Kesalahan Server Internal' };
    }
};
