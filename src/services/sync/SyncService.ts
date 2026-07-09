import { openDB } from 'idb';

// 1. Ambil URL Google Script dari Environment Variable Vercel yang tadi diisi
const API_URL = import.meta.env.VITE_API_URL;

// 2. Buat koneksi ke Database Lokal (IndexedDB)
export async function hubungkanDbLokal() {
  return openDB('toko_ceria_db', 1, {
    upgrade(db) {
      // Membuat tabel 'products' di lokal jika belum ada
      if (!db.objectStoreNames.contains('products')) {
        db.createObjectStore('products', { keyPath: 'id' });
      }
      // Membuat tabel 'transaksi' di lokal beserta index untuk antrean sync
      if (!db.objectStoreNames.contains('transaksi')) {
        const transaksiStore = db.createObjectStore('transaksi', { keyPath: 'id_transaksi' });
        transaksiStore.createIndex('by-status', 'status_sync');
      }
    },
  });
}

// 3. Fungsi untuk Download data dari Google Sheets ke Laptop/HP (Aplikasi dibuka)
export async function downloadProdukKeLokal() {
  try {
    const response = await fetch(`${API_URL}?table=products`);
    if (!response.ok) throw new Error('Gagal mengambil data');
    
    const produkDariServer = await response.json();
    const db = await hubungkanDbLokal();
    
    // Simpan semua produk ke database lokal (IndexedDB)
    const tx = db.transaction('products', 'readwrite');
    for (const produk of produkDariServer) {
      await tx.store.put(produk);
    }
    await tx.done;
    console.log('✅ Data produk di lokal berhasil diperbarui!');
    return { success: true };
  } catch (error) {
    console.error('❌ Gagal download produk (Mode Offline aktif):', error);
    return { success: false, error };
  }
}

// 4. Fungsi untuk Upload data transaksi offline ke Google Sheets
export async function kirimTransaksiOffline() {
  try {
    const db = await hubungkanDbLokal();
    // Cari transaksi yang status_sync nya masih 'pending'
    const antreanOffline = await db.getAllFromIndex('transaksi', 'by-status', 'pending');
    
    if (antreanOffline.length === 0) return; // Keluar jika tidak ada antrean

    // Kirim massal ke Google Sheets
    const response = await fetch(`${API_URL}?table=transaksi`, {
      method: 'POST',
      redirect: 'follow',
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify(antreanOffline),
    });

    const hasil = await response.json();

    if (hasil.status === 'success') {
      // Jika sukses, ubah status di lokal menjadi 'success' agar tidak dikirim lagi
      const tx = db.transaction('transaksi', 'readwrite');
      for (const transaksi of antreanOffline) {
        transaksi.status_sync = 'success';
        await tx.store.put(transaksi);
      }
      await tx.done;
      console.log('🚀 Antrean offline berhasil disinkronkan ke Google Sheets!');
    }
  } catch (error) {
    console.error('❌ Gagal sinkronisasi otomatis:', error);
  }
}

// 5. Otomatis kirim data begitu komputer mendeteksi ada Sinyal Internet (Online)
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    console.log('🌐 Internet tersambung! Menyinkronkan data...');
    kirimTransaksiOffline();
  });
}
