import { ref, get } from "firebase/database";
import { db } from './firebase-config.js'; // Impor koneksi aman

export const handler = async (event, context) => {
  try {
    const productsRef = ref(db, 'products');
    const snapshot = await get(productsRef);

    if (snapshot.exists()) {
      return {
        statusCode: 200,
        body: JSON.stringify(snapshot.val()),
      };
    } else {
      return {
        statusCode: 404,
        body: JSON.stringify({ message: "Produk tidak ditemukan." }),
      };
    }
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ message: "Gagal mengambil data produk.", error: error.message }),
    };
  }
};
