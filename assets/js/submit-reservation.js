import { ref, push, serverTimestamp } from "firebase/database";
import { db } from './firebase-config.js';

export const handler = async (event) => {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    try {
        const data = JSON.parse(event.body);

        // Validasi sederhana di server
        if (!data.name || !data.email || !data.date || !data.time || !data.guests) {
            return {
                statusCode: 400,
                body: JSON.stringify({ message: 'Data reservasi tidak lengkap.' }),
            };
        }

        const reservationsRef = ref(db, 'reservations');
        await push(reservationsRef, {
            ...data,
            status: 'new', // Tandai sebagai reservasi baru
            receivedAt: serverTimestamp(), // Gunakan timestamp server
        });

        return {
            statusCode: 201,
            body: JSON.stringify({ message: 'Reservasi berhasil disimpan.' }),
        };

    } catch (error) {
        console.error("Reservation submission error:", error);
        return {
            statusCode: 500,
            body: JSON.stringify({ message: 'Terjadi kesalahan di server.' }),
        };
    }
};
