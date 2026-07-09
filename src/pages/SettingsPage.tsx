/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState, useRef } from 'react';
import { Download, Upload, Shield, Database, Store, Save, Printer, Globe, FileInput, Trash2, FileDown, FileUp, RefreshCw, CheckCircle2, AlertCircle, Moon } from 'lucide-react';
import { dbProvider } from '@/services/db/DatabaseService';
import { printerService } from '@/services/hardware/PrinterService';
import { useSettingsStore } from '@/store/useSettingsStore';
import { formatCurrency, cn, generateProductId, downloadFile } from '@/lib/utils';
import { indexdbBarang } from '@/lib/indexdbBarang.ts';
import { indexdbTransaksi } from '@/lib/indexdbTransaksi.ts';
import { indexdbCustomer } from '@/lib/indexdbCustomer.ts';
import { indexdbSupplier } from '@/lib/indexdbSupplier.ts';
import { indexdbCategory } from '@/lib/indexdbCategory.ts';
import { indexdbDebt } from '@/lib/indexdbDebt.ts';
import { indexdbDiscount } from '@/lib/indexdbDiscount.ts';
import { indexdbExpense } from '@/lib/indexdbExpense.ts';
import { indexdbRestock } from '@/lib/indexdbRestock.ts';
import { indexdbRetur } from '@/lib/indexdbRetur.ts';
import { indexdbUser } from '@/lib/indexdbUser.ts';

// ✅ INTEGRASI JEMBATAN SINKRONISASI GOOGLE SHEETS
import { kirimTransaksiOffline } from '@/services/sync/SyncService';

// ✅ Pisahkan loading state per aksi agar tombol lain tetap aktif
type LoadingKey = 'backup' | 'restore' | 'importProducts' | 'resetTransactions' | 'backupTransactions' | 'testPrint' | 'saveInfo' | 'sync' | 'deduplicate' | 'migrateIds' | null;

const SettingsPage: React.FC = () => {
  const { storeInfo, updateStoreInfo, printer, updatePrinterSettings, darkMode, toggleDarkMode } = useSettingsStore();
  const [loadingKey, setLoadingKey] = useState<LoadingKey>(null);
  const [status, setStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);
  const [localStoreInfo, setLocalStoreInfo] = useState(storeInfo);

  const [localPrinter, setLocalPrinter] = useState(printer);

  // ✅ State khusus untuk manajemen akun user (Kasir & Admin)
  const [users, setUsers] = useState<any[]>([]);
  const [userLoadingId, setUserLoadingId] = useState<string | null>(null);

  // State untuk form Tambah User Baru
  const [showAddUser, setShowAddUser] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [newName, setNewName] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState<'admin' | 'kasir' | 'gudang'>('gudang');

  const fetchUsers = async () => {
    try {
      const allUsers = await indexdbUser.getAll();
      setUsers(allUsers);
    } catch (e) {
      console.error("Gagal mengambil data user:", e);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleUpdateUser = async (user: any, updatedName: string, updatedPassword: string) => {
    if (!updatedName.trim()) {
      showStatus('error', 'Nama lengkap tidak boleh kosong!');
      return;
    }
    if (!updatedPassword.trim()) {
      showStatus('error', 'Password tidak boleh kosong!');
      return;
    }

    try {
      setUserLoadingId(user.id);
      
      const updatedUser = {
        ...user,
        name: updatedName.trim(),
        password: updatedPassword.trim(),
        updated_at: Date.now()
      };

      await indexdbUser.save(updatedUser);

      // ✅ Jika user yang diedit adalah user yang sedang login, update local storage sesinya secara real-time!
      const currentUser = indexdbUser.getCurrentUser();
      if (currentUser && currentUser.id === user.id) {
        const updatedSession = {
          ...currentUser,
          name: updatedName.trim(),
        };
        localStorage.setItem('pos_current_user', JSON.stringify(updatedSession));
        // Sinkronisasi data internal indexdbUser agar session instant ter-update di UI
        (indexdbUser as any).currentUser = updatedSession;
      }

      showStatus('success', `Berhasil memperbarui data akun "${user.username}"!`);
      await fetchUsers();
    } catch (e) {
      console.error("Gagal edit user:", e);
      showStatus('error', 'Terjadi kesalahan sistem saat memperbarui akun.');
    } finally {
      setUserLoadingId(null);
    }
  };

  const handleCreateUser = async () => {
    if (!newUsername.trim()) {
      showStatus('error', 'Username tidak boleh kosong!');
      return;
    }
    if (!newName.trim()) {
      showStatus('error', 'Nama Lengkap tidak boleh kosong!');
      return;
    }
    if (!newPassword.trim()) {
      showStatus('error', 'Password tidak boleh kosong!');
      return;
    }

    try {
      setUserLoadingId('new_user_action');
      
      const allUsers = await indexdbUser.getAll();
      const existing = allUsers.find(u => u.username.toLowerCase() === newUsername.trim().toLowerCase());
      if (existing) {
        showStatus('error', `Username "${newUsername}" sudah terdaftar! Gunakan username lain.`);
        return;
      }

      const newUser = {
        id: indexdbUser.generateId(),
        username: newUsername.trim().toLowerCase(),
        password: newPassword.trim(),
        name: newName.trim(),
        role: newRole,
        isActive: true,
        created_at: Date.now(),
        updated_at: Date.now()
      };

      await indexdbUser.save(newUser);
      showStatus('success', `Akun "${newUsername}" berhasil didaftarkan!`);
      
      // Reset form input
      setNewUsername('');
      setNewName('');
      setNewPassword('');
      setNewRole('kasir');
      setShowAddUser(false);
      
      await fetchUsers();
    } catch (e) {
      console.error("Gagal membuat user baru:", e);
      showStatus('error', 'Terjadi kesalahan sistem saat membuat akun.');
    } finally {
      setUserLoadingId(null);
    }
  };

  const handleDeleteUser = async (user: any) => {
    if (user.id === 'user_admin' || user.username === 'admin') {
      showStatus('error', 'Tidak diizinkan menghapus administrator utama!');
      return;
    }
    const curr = indexdbUser.getCurrentUser();
    if (curr && curr.id === user.id) {
      showStatus('error', 'Anda tidak bisa menghapus akun yang sedang Anda gunakan saat ini!');
      return;
    }

    if (!confirm(`Apakah Anda yakin ingin menghapus akun "${user.name}" (${user.username}) secara permanen?`)) return;

    try {
      setUserLoadingId(user.id);
      await indexdbUser.delete(user.id);
      showStatus('success', `Akun "${user.username}" berhasil dihapus.`);
      await fetchUsers();
    } catch (e) {
      console.error("Gagal menghapus user:", e);
      showStatus('error', 'Terjadi kesalahan saat menghapus akun.');
    } finally {
      setUserLoadingId(null);
    }
  };

  useEffect(() => {
    setLocalStoreInfo(storeInfo);
  }, [storeInfo]);

  useEffect(() => {
    setLocalPrinter(printer);
  }, [printer]);

  // ✅ State khusus untuk progress sinkronisasi
  const [syncProgress, setSyncProgress] = useState<{ step: string; percent: number } | null>(null);

  // ✅ Ref untuk reset input file setelah digunakan
  const restoreInputRef = useRef<HTMLInputElement>(null);
  const importInputRef = useRef<HTMLInputElement>(null);

  const isLoading = (key: LoadingKey) => loadingKey === key;
  const anyLoading = loadingKey !== null;

  const showStatus = (type: 'success' | 'error', message: string, duration = 4000) => {
    setStatus({ type, message });
    setTimeout(() => setStatus(null), duration);
  };

  const handleSavePrinter = () => {
    setLoadingKey('saveInfo');
    try {
      // Validasi defensif
      const paperWidthMm = localPrinter.paperWidthMm === 80 ? 80 : 58;
      const extraPageHeightMm = Math.max(0, Number(localPrinter.extraPageHeightMm) || 0);
      const barcodeRenderMode = localPrinter.barcodeRenderMode === 'svg' ? 'svg' : 'png';
      updatePrinterSettings({ paperWidthMm, extraPageHeightMm, barcodeRenderMode });
      showStatus('success', 'Pengaturan printer berhasil disimpan!');
    } catch (e) {
      console.error('Save printer settings error:', e);
      showStatus('error', 'Gagal menyimpan pengaturan printer. Cek konsol untuk detail.');
    } finally {
      setLoadingKey(null);
    }
  };

  // ✅ BACKUP SELURUH DATA (produk + transaksi + settings)
  const handleBackup = async () => {
    try {
      setLoadingKey('backup');
      const data = await dbProvider.exportData();
      const filename = `backup_${localStoreInfo.name.toLowerCase().replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.json`;

      await downloadFile(filename, data, 'json');
      showStatus('success', 'Database berhasil dicadangkan!');
    } catch (error) {
      console.error("Backup error:", error);
      showStatus('error', 'Gagal mencadangkan database. Cek konsol untuk detail.');
    } finally {
      setLoadingKey(null);
    }
  };

  // ✅ RESTORE DATABASE (timpa semua data dari file JSON)
  const handleRestore = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!confirm('⚠️ Peringatan: Memulihkan data akan MENGHAPUS semua data produk dan transaksi saat ini, lalu menggantinya dengan data dari file. Lanjutkan?')) {
      // ✅ Reset input dan batalkan
      if (restoreInputRef.current) restoreInputRef.current.value = '';
      return;
    }

    setLoadingKey('restore');
    const reader = new FileReader();

    reader.onload = async (e) => {
      try {
        const json = e.target?.result as string;
        // ✅ Validasi JSON sebelum proses
        let parsed: any;
        try {
          parsed = JSON.parse(json);
        } catch {
          showStatus('error', 'File tidak valid. Pastikan file adalah JSON yang benar.');
          setLoadingKey(null);
          if (restoreInputRef.current) restoreInputRef.current.value = '';
          return;
        }

        // ✅ Validasi struktur backup
        if (!parsed.products && !parsed.transactions) {
          showStatus('error', 'Format file backup tidak dikenali. Pastikan file berasal dari fitur Backup aplikasi ini.');
          setLoadingKey(null);
          if (restoreInputRef.current) restoreInputRef.current.value = '';
          return;
        }

        const success = await dbProvider.importData(json);
        if (success) {
          showStatus('success', 'Data berhasil dipulihkan! Halaman akan dimuat ulang...', 2500);
          setTimeout(() => window.location.reload(), 2500);
        } else {
          showStatus('error', 'Gagal memulihkan data. Cek konsol untuk detail.');
          setLoadingKey(null);
          if (restoreInputRef.current) restoreInputRef.current.value = '';
        }
      } catch (error) {
        console.error("Restore error:", error);
        showStatus('error', 'Terjadi kesalahan saat memulihkan data.');
        setLoadingKey(null);
        if (restoreInputRef.current) restoreInputRef.current.value = '';
      }
    };

    reader.onerror = () => {
      showStatus('error', 'Gagal membaca file.');
      setLoadingKey(null);
      if (restoreInputRef.current) restoreInputRef.current.value = '';
    };

    reader.readAsText(file);
  };

  // ✅ IMPORT PRODUK MASSAL dari JSON
  const handleImportProducts = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!confirm('Import produk akan menambahkan/menimpa produk dengan ID/SKU yang sama. Produk yang tidak ada di file TIDAK akan dihapus. Lanjutkan?')) {
      // ✅ Reset input dan batalkan — loadingKey tidak perlu diubah karena belum diset
      if (importInputRef.current) importInputRef.current.value = '';
      return;
    }

    setLoadingKey('importProducts');
    const reader = new FileReader();

    reader.onload = async (e) => {
      try {
        const json = e.target?.result as string;
        let data: any;
        try {
          data = JSON.parse(json);
        } catch {
          showStatus('error', 'File tidak valid. Pastikan file adalah JSON yang benar.');
          setLoadingKey(null);
          if (importInputRef.current) importInputRef.current.value = '';
          return;
        }

        console.log('📦 Data JSON yang di-parse:', typeof data, Array.isArray(data) ? 'Array' : 'Object');

        // ✅ Support format array langsung atau object dengan key products/Products
        const rawProducts = Array.isArray(data) ? data : (data.products || data.Products || []);

        console.log('📦 Jumlah produk dalam file:', rawProducts.length);

        if (!Array.isArray(rawProducts) || rawProducts.length === 0) {
          showStatus('error', 'Format file tidak valid. File harus berisi array produk atau object dengan key "products".');
          setLoadingKey(null);
          if (importInputRef.current) importInputRef.current.value = '';
          return;
        }

        const beforeCount = await indexdbBarang.count();
        console.log('📊 Jumlah produk sebelum import:', beforeCount);

        // ✅ Normalisasi dan validasi setiap produk
        // ID deterministik berbasis SKU — produk yang sama selalu dapat ID yang sama
        const normalizedProducts = rawProducts
          .map((product: any) => {
            if (!product.name && !product.nama) return null;

            const sku = (product.sku || product.barcode || '').toString().trim();
            const barcode = (product.barcode || product.sku || '').toString().trim();

            // ✅ Jika file sudah punya id yang valid (bukan format lama berantakan), pakai.
            // Jika tidak, generate dari SKU agar deterministik.
            const hasCleanId = product.id
              && typeof product.id === 'string'
              && product.id.startsWith('prod_');
            const id = hasCleanId
              ? product.id
              : generateProductId(sku, barcode);

            return {
              id,
              sku,
              barcode,
              name: product.name || product.nama,
              category: product.category || product.kategori || 'Umum',
              priceRetail: parseInt(String(product.priceRetail || product.price || product.harga || product.retail_price || 0)),
              priceWholesale: parseInt(String(product.priceWholesale || product.wholesale_price || product.harga_grosir || product.price || 0)),
              stock: parseInt(String(product.stock || product.stok || product.quantity || 0)),
              min_stock: parseInt(String(product.min_stock || product.minStock || product.stok_minimum || 0)),
              updated_at: Date.now()
            };
          })
          .filter((p): p is NonNullable<typeof p> => p !== null);

        console.log('📦 Jumlah produk valid setelah normalisasi:', normalizedProducts.length);

        if (normalizedProducts.length === 0) {
          showStatus('error', 'Tidak ada produk valid dalam file. Pastikan setiap produk memiliki field "name".');
          setLoadingKey(null);
          if (importInputRef.current) importInputRef.current.value = '';
          return;
        }

        const result = await dbProvider.importProducts(normalizedProducts);
        const afterCount = await indexdbBarang.count();
        const newProducts = afterCount - beforeCount;

        console.log('📈 Berhasil:', result.success, '| Gagal:', result.error, '| Total sekarang:', afterCount);

        if (result.success > 0) {
          showStatus(
            'success',
            `✅ Berhasil import ${result.success} produk! (+${newProducts > 0 ? newProducts : 0} baru, ${result.success - (newProducts > 0 ? newProducts : 0)} diperbarui). Total: ${afterCount} produk. Halaman akan dimuat ulang...`,
            3000
          );
          setTimeout(() => window.location.reload(), 3000);
        } else {
          showStatus('error', `Gagal import semua produk. ${result.error} error. Cek konsol untuk detail.`);
          setLoadingKey(null);
          if (importInputRef.current) importInputRef.current.value = '';
        }
      } catch (error) {
        console.error('Import produk error:', error);
        showStatus('error', 'Terjadi kesalahan saat import produk.');
        setLoadingKey(null);
        if (importInputRef.current) importInputRef.current.value = '';
      }
    };

    reader.onerror = () => {
      showStatus('error', 'Gagal membaca file.');
      setLoadingKey(null);
      if (importInputRef.current) importInputRef.current.value = '';
    };

    reader.readAsText(file);
  };

  // ✅ MIGRASI ID PRODUK LAMA → FORMAT BARU prod_<sku>
  const handleMigrateIds = async () => {
    const currentCount = await indexdbBarang.count();

    if (!confirm(
      `Fitur ini akan mengubah ID produk lama (format acak/timestamp) ke format baru yang konsisten (prod_<sku>).\n\n` +
      `Total ${currentCount.toLocaleString("id-ID")} produk akan diperiksa.\n` +
      `Produk duplikat dengan SKU yang sama akan digabung otomatis.\n\n` +
      `Lakukan backup terlebih dahulu sebelum menjalankan ini. Lanjutkan?`
    )) return;

    try {
      setLoadingKey("migrateIds");
      const result = await indexdbBarang.migrateIds();
      
      if (result.migrated === 0) {
        showStatus("success", `✅ Semua ID sudah dalam format baru. ${result.skipped} produk tidak perlu diubah.`);
      } else {
        showStatus(
          "success",
          `✅ Migrasi selesai! ${result.migrated} ID diperbarui ke format prod_<sku>. Halaman akan dimuat ulang...`,
          3000
        );
        setTimeout(() => window.location.reload(), 3000);
      }
    } catch (e) {
      console.error("Migrate IDs error:", e);
      showStatus("error", "Gagal migrasi ID. Cek konsol untuk detail.");
    } finally {
      setLoadingKey(null);
    }
  };

  // ✅ HAPUS DUPLIKAT PRODUK berdasarkan SKU/barcode
  const handleDeduplicate = async () => {
    const currentCount = await indexdbBarang.count();

    if (!confirm(`Database saat ini memiliki ${currentCount.toLocaleString("id-ID")} produk.\n\nFitur ini akan menghapus produk duplikat (SKU/barcode sama), menyimpan yang paling baru.\n\nLanjutkan?`)) return;

    try {
      setLoadingKey("deduplicate");
      const result = await indexdbBarang.deduplicateBySku();
      
      if (result.removed === 0) {
        showStatus("success", `✅ Tidak ada duplikat ditemukan. Total ${result.kept.toLocaleString("id-ID")} produk sudah unik.`);
      } else {
        showStatus(
          "success",
          `✅ Berhasil hapus ${result.removed.toLocaleString("id-ID")} duplikat! Tersisa ${result.kept.toLocaleString("id-ID")} produk unik. Halaman akan dimuat ulang...`,
          3000
        );
        setTimeout(() => window.location.reload(), 3000);
      }
    } catch (e) {
      console.error("Deduplicate error:", e);
      showStatus("error", "Gagal menghapus duplikat. Cek konsol untuk detail.");
    } finally {
      setLoadingKey(null);
    }
  };

  // ✅ VERIFIKASI DATA LOKAL & SINKRONISASI KE GOOGLE SHEETS
  const handleSync = async () => {
    try {
      setLoadingKey('sync');
      
      // 1. Validasi internet aktif
      if (!navigator.onLine) {
        showStatus('error', 'Gagal sinkronisasi. Perangkat Anda sedang offline / tidak ada internet!');
        setLoadingKey(null);
        return;
      }

      setSyncProgress({ step: 'Menghubungkan & mengirim data ke Google Sheets...', percent: 20 });

      // 2. Jalankan pendorong antrean transaksi offline ke Apps Script
      await kirimTransaksiOffline();

      setSyncProgress({ step: 'Memverifikasi integritas data lokal...', percent: 60 });

      // 3. Hitung total database ter-update
      const [productCount, transactionCount, customerCount, supplierCount] = await Promise.all([
        indexdbBarang.count(),
        indexdbTransaksi.count(),
        indexdbCustomer.count(),
        indexdbSupplier.count(),
      ]);

      setSyncProgress({ step: 'Finalisasi...', percent: 95 });

      setTimeout(() => {
        setSyncProgress(null);
        showStatus(
          'success',
          `✅ Sinkronisasi & Verifikasi Selesai!\n` +
          `🚀 Transaksi gantung berhasil diunggah ke Google Sheets.\n` +
          `📦 ${productCount} produk · 🧾 ${transactionCount} transaksi aman diverifikasi.`
        );
      }, 500);
    } catch (e) {
      console.error('Sync error:', e);
      setSyncProgress(null);
      showStatus('error', 'Sinkronisasi gagal. Hubungi admin atau cek URL API Vercel Anda.');
    } finally {
      setLoadingKey(null);
    }
  };

  // ✅ SIMPAN INFO TOKO
  const handleSaveInfo = () => {
    setLoadingKey('saveInfo');
    try {
      updateStoreInfo(localStoreInfo);
      showStatus('success', 'Informasi toko berhasil disimpan!');
    } catch (error) {
      console.error("Save info error:", error);
      showStatus('error', 'Gagal menyimpan informasi toko.');
    } finally {
      setLoadingKey(null);
    }
  };

  // ✅ CETAK STRUK PERCOBAAN
  const handleTestPrint = async () => {
    try {
      setLoadingKey('testPrint');
      await printerService.printReceipt({
        title: localStoreInfo.name,
        address: localStoreInfo.address,
        phone: localStoreInfo.phone,
        items: [
          { name: "TEST ITEM 1", price: 1000, quantity: 1 },
          { name: "TEST ITEM 2", price: 5000, quantity: 2 }
        ],
        total: 11000,
        customerName: "PELANGGAN TEST",
        footer: localStoreInfo.footer || "TERIMA KASIH TELAH MENCOBA CETAK!"
      });
      showStatus('success', 'Perintah cetak dikirim ke printer!');
    } catch (e) {
      console.error("Test print error:", e);
      showStatus('error', 'Gagal mencetak struk percobaan.');
    } finally {
      setLoadingKey(null);
    }
  };

  // ✅ RESET RIWAYAT TRANSAKSI (produk tetap utuh)
  const handleResetTransactions = async () => {
    if (!confirm('⚠️ PERINGATAN: Ini akan MENGHAPUS SEMUA RIWAYAT TRANSAKSI secara permanen. Data produk dan pengaturan TIDAK AKAN DIHAPUS. Tindakan ini tidak dapat dibatalkan. Lanjutkan?')) return;

    try {
      setLoadingKey('resetTransactions');
      const success = await dbProvider.resetTransactionData();
      if (success) {
        showStatus('success', 'Semua riwayat transaksi berhasil dihapus!');
      } else {
        showStatus('error', 'Gagal menghapus data transaksi.');
      }
    } catch (e) {
      console.error("Reset transaksi error:", e);
      showStatus('error', 'Gagal menghapus data transaksi. Cek konsol untuk detail.');
    } finally {
      setLoadingKey(null);
    }
  };

  // ✅ RESET APLIKASI — Hapus SEMUA Data (produk, transaksi, pelanggan, supplier, kategori, hutang, diskon, pengeluaran)
  const handleResetApp = async () => {
    if (!confirm(
      '⚠️⚠️⚠️ PERINGATAN EKSTREM ⚠️⚠️⚠️\n\n' +
      'Ini akan MENGHAPUS SEMUA DATA berikut:\n' +
      '• Semua Produk\n' +
      '• Semua Riwayat Transaksi\n' +
      '• Semua Pelanggan\n' +
      '• Semua Supplier\n' +
      '• Semua Kategori\n' +
      '• Semua Hutang\n' +
      '• Semua Diskon\n' +
      '• Semua Pengeluaran\n' +
      '• Pengaturan Toko (kembali ke default)\n\n' +
      'TINDAKAN INI TIDAK DAPAT DIBATALKAN!\n\n' +
      'Ketik "RESET" di kotak dialog berikut untuk konfirmasi.'
    )) return;

    // Konfirmasi kedua dengan input manual
    const userInput = prompt('Ketik "RESET" (tanpa tanda kutip) untuk mengkonfirmasi penghapusan SEMUA data:');
    if (userInput !== 'RESET') {
      showStatus('error', 'Reset dibatalkan — teks konfirmasi tidak sesuai.');
      return;
    }

    try {
      setLoadingKey('restore');

      // ✅ Tutup semua koneksi aktif IndexedDB terlebih dahulu agar tidak memblokir penghapusan database
      const dbInstances = [
        indexdbBarang,
        indexdbTransaksi,
        indexdbCustomer,
        indexdbSupplier,
        indexdbCategory,
        indexdbDebt,
        indexdbDiscount,
        indexdbExpense,
        indexdbRestock,
        indexdbRetur,
        indexdbUser
      ];

      for (const instance of dbInstances) {
        try {
          const dbObj = (instance as any).db;
          if (dbObj && typeof dbObj.close === 'function') {
            dbObj.close();
          }
          (instance as any).db = null;
          if ('initPromise' in instance) {
            (instance as any).initPromise = null;
          }
          if ('seedPromise' in instance) {
            (instance as any).seedPromise = null;
          }
        } catch (err) {
          console.error("Error closing database connection while resetting:", err);
        }
      }

      // ✅ Hapus SEMUA IndexedDB database — cara paling clean
      const dbNames = [
        'barangDB', 'transaksiDB', 'customerDB', 'supplierDB',
        'categoryDB', 'debtDB', 'discountDB', 'expenseDB', 'restockDB', 'returDB', 'userDB'
      ];
      await Promise.all(dbNames.map(dbName =>
        new Promise<void>((resolve, reject) => {
          const req = indexedDB.deleteDatabase(dbName);
          req.onsuccess = () => resolve();
          req.onerror = () => reject(req.error);
          req.onblocked = () => {
            console.warn(`⚠️ Database ${dbName} di-block, force close...`);
            resolve(); // Non-fatal, lanjutkan
          };
        })
      ));

      // ✅ Reset pengaturan toko ke default
      useSettingsStore.getState().updateStoreInfo({
        name: 'Toko Saya',
        phone: '',
        address: '',
        footer: 'Terima Kasih'
      });

      showStatus(
        'success',
        '✅ SEMUA DATA BERHASIL DIHAPUS! Aplikasi akan dimuat ulang dari awal...',
        3000
      );

      setTimeout(() => window.location.reload(), 3000);
    } catch (e) {
      console.error('Reset app error:', e);
      showStatus('error', 'Gagal mereset aplikasi. Cek konsol untuk detail.');
    } finally {
      setLoadingKey(null);
    }
  };

  // ✅ BACKUP TRANSAKSI SAJA (hanya riwayat penjualan)
  const handleBackupTransactions = async () => {
    try {
      setLoadingKey("backupTransactions");
      const data = await dbProvider.backupToJSON();

      if (!data.transactions || data.transactions.length === 0) {
        showStatus("error", "Tidak ada data transaksi untuk dicadangkan.");
        return;
      }

      const exportPayload = {
        version: 1,
        exported_at: new Date().toISOString(),
        type: "transactions_only",
        transactions: data.transactions,
      };

      const filename = `transaksi_${localStoreInfo.name.toLowerCase().replace(/\s+/g, "_")}_${new Date().toISOString().split("T")[0]}.json`;
      const jsonData = JSON.stringify(exportPayload, null, 2);

      // For web browsers - download file directly
      const blob = new Blob([jsonData], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showStatus("success", `Backup ${data.transactions.length} transaksi berhasil diunduh!`);
    } catch (error) {
      console.error("Backup transaksi error:", error);
      showStatus("error", "Gagal mencadangkan transaksi. Cek konsol untuk detail.");
    } finally {
      setLoadingKey(null);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-24">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Toko</h1>
        <p className="text-sm text-slate-500 font-medium">Pengaturan identitas dan perangkat</p>
      </div>

      {status && (
        <div className={cn(
          "p-5 rounded-[24px] flex items-center gap-4 border shadow-sm animate-in zoom-in duration-300",
          status.type === 'success' ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-red-50 border-red-100 text-red-700'
        )}>
          <div className={cn(
            "w-8 h-8 rounded-full flex items-center justify-center shrink-0",
            status.type === 'success' ? 'bg-emerald-100' : 'bg-red-100'
          )}>
            <Shield size={16} />
          </div>
          <p className="text-sm font-bold tracking-tight">{status.message}</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Informasi Toko */}
        <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm space-y-6 flex flex-col h-full">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 shadow-inner">
              <Store size={28} />
            </div>
            <div>
              <h3 className="font-black text-xl text-slate-800 tracking-tight">Identitas Toko</h3>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Informasi Bisnis</p>
            </div>
          </div>

          <div className="space-y-4 flex-1">
             <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Nama Toko</label>
                <input 
                  type="text" 
                  value={localStoreInfo.name}
                  onChange={e => setLocalStoreInfo({...localStoreInfo, name: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-100 p-4 rounded-2xl font-bold text-slate-700 focus:border-[#10B981] focus:bg-white outline-none transition-all"
                />
             </div>

             <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Tema Dark</label>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Mode Gelap</span>
                  <button
                    onClick={() => toggleDarkMode()}
                    className={cn(
                      "w-10 h-10 flex items-center justify-center rounded-full transition-all",
                      darkMode ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-500"
                    )}
                  >
                    <Moon size={16} className={darkMode ? "text-white" : "text-slate-500"} />
                  </button>
                </div>
             </div>
             
             <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Telepon</label>
                <input 
                  type="text" 
                  value={localStoreInfo.phone}
                  onChange={e => setLocalStoreInfo({...localStoreInfo, phone: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-100 p-4 rounded-2xl font-bold text-slate-700 focus:border-[#10B981] focus:bg-white outline-none transition-all"
                />
             </div>

             <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Alamat</label>
                <textarea 
                  rows={2}
                  value={localStoreInfo.address}
                  onChange={e => setLocalStoreInfo({...localStoreInfo, address: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-100 p-4 rounded-2xl font-bold text-slate-700 focus:border-[#10B981] focus:bg-white outline-none transition-all resize-none"
                />
             </div>

             <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Footer Struk</label>
                <input 
                  type="text" 
                  value={localStoreInfo.footer}
                  onChange={e => setLocalStoreInfo({...localStoreInfo, footer: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-100 p-4 rounded-2xl font-bold text-slate-700 focus:border-[#10B981] focus:bg-white outline-none transition-all"
                  placeholder="Terima Kasih..."
                />
             </div>
          </div>
          
          <button 
            onClick={handleSaveInfo}
            disabled={isLoading('saveInfo')}
            className="w-full bg-[#10B981] hover:bg-emerald-600 text-white py-4 rounded-2xl font-black transition-all shadow-lg shadow-green-100 flex items-center justify-center gap-3 active:scale-98 disabled:opacity-60"
          >
            {isLoading('saveInfo') ? (
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Save size={18} strokeWidth={2.5} />
            )}
            SIMPAN
          </button>
        </div>

        {/* Printer Settings */}
        <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm space-y-6 h-full flex flex-col">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 shadow-inner">
              <Printer size={28} />
            </div>
            <div>
              <h3 className="font-black text-xl text-slate-800 tracking-tight">Printer Struk</h3>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Sistem Cetak Universal</p>
            </div>
          </div>

          <div className="flex-1 space-y-4">
            <div className="p-6 bg-emerald-50/30 rounded-[28px] border border-emerald-100 flex items-center gap-4">
               <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-emerald-500 shadow-sm">
                  <Globe size={20} />
               </div>
               <div className="flex-1">
                  <p className="text-sm font-black text-slate-700">Mode Web Print</p>
                  <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-tighter">Aktif - Kompatibel dengan Android & Windows</p>
               </div>
            </div>

            <div className="bg-slate-50 p-5 rounded-[24px] space-y-2">
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Catatan Penting</p>
               <p className="text-[11px] text-slate-500 leading-relaxed font-medium">
                  Pastikan printer termal Anda sudah terdeteksi di sistem (Windows) atau menggunakan aplikasi pihak ketiga seperti <b>ESC/POS Print Service</b> di Android.
               </p>
            </div>

              {/* ✅ Pengaturan ukuran kertas untuk mengurangi sisa kertas */}
              <div className="bg-slate-50 p-5 rounded-[24px] space-y-4">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Ukuran Kertas</p>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setLocalPrinter((p) => ({ ...p, paperWidthMm: 58 }))}
                    className={cn(
                      'py-3 rounded-2xl font-black text-xs uppercase tracking-widest border transition-all',
                      localPrinter.paperWidthMm === 58
                        ? 'bg-slate-900 text-white border-slate-900'
                        : 'bg-white text-slate-700 border-slate-200 hover:border-emerald-400'
                    )}
                  >
                    58mm
                  </button>
                  <button
                    type="button"
                    onClick={() => setLocalPrinter((p) => ({ ...p, paperWidthMm: 80 }))}
                    className={cn(
                      'py-3 rounded-2xl font-black text-xs uppercase tracking-widest border transition-all',

