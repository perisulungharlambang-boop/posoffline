import React, { useState, useEffect } from 'react';

// Helper classname jika dibutuhkan
const cn = (...classes: any[]) => classes.filter(Boolean).join(' ');

// Mock indexdbUser sederhana untuk mencegah error compile pada types
const indexdbUser = {
  getAllUsers: async () => {
    const data = localStorage.getItem('pos_users');
    return data ? JSON.parse(data) : [{ id: 'user_admin', username: 'admin', name: 'Owner Toko', role: 'admin', password: 'admin' }];
  },
  createUser: async (user: any) => {
    const data = localStorage.getItem('pos_users');
    const users = data ? JSON.parse(data) : [{ id: 'user_admin', username: 'admin', name: 'Owner Toko', role: 'admin', password: 'admin' }];
    users.push(user);
    localStorage.setItem('pos_users', JSON.stringify(users));
  },
  updateUser: async (id: string, updatedUser: any) => {
    const data = localStorage.getItem('pos_users');
    if (data) {
      let users = JSON.parse(data);
      users = users.map((u: any) => u.id === id ? updatedUser : u);
      localStorage.setItem('pos_users', JSON.stringify(users));
    }
  },
  deleteUser: async (id: string) => {
    const data = localStorage.getItem('pos_users');
    if (data) {
      let users = JSON.parse(data);
      users = users.filter((u: any) => u.id !== id);
      localStorage.setItem('pos_users', JSON.stringify(users));
    }
  },
  getCurrentUser: () => {
    return { id: 'user_admin', username: 'admin', role: 'admin' };
  }
};

const SettingsPage: React.FC = () => {
  const [localStoreInfo, setLocalStoreInfo] = useState({
    name: 'Toko Ceria',
    address: 'Jl. Setia Makmur',
    phone: '081234567890',
    footer: 'Terima Kasih'
  });
  const [isSavingInfo, setIsSavingInfo] = useState(false);

  const [localPrinter, setLocalPrinter] = useState({
    paperWidthMm: 58
  });

  const [users, setUsers] = useState<any[]>([]);
  const [showAddUser, setShowAddUser] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [newName, setNewName] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState<'admin' | 'kasir' | 'gudang'>('kasir');
  const [userLoadingId, setUserLoadingId] = useState<string | null>(null);

  useEffect(() => {
    loadAllUsers();
  }, []);

  const loadAllUsers = async () => {
    try {
      const allUsers = await indexdbUser.getAllUsers();
      setUsers(allUsers || []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveInfo = async () => {
    setIsSavingInfo(true);
    setTimeout(() => {
      setIsSavingInfo(false);
      alert('Informasi nota berhasil disimpan!');
    }, 500);
  };

  const handleCreateUser = async () => {
    if (!newUsername.trim() || !newName.trim() || !newPassword.trim()) {
      alert('Semua kolom wajib diisi!');
      return;
    }
    setUserLoadingId('new_user_action');
    try {
      await indexdbUser.createUser({
        id: 'user_' + Date.now(),
        username: newUsername.trim().toLowerCase(),
        name: newName.trim(),
        password: newPassword.trim(),
        role: newRole
      });
      setNewUsername('');
      setNewName('');
      setNewPassword('');
      setShowAddUser(false);
      await loadAllUsers();
    } catch (err) {
      alert('Gagal mendaftarkan pengguna baru.');
    } finally {
      setUserLoadingId(null);
    }
  };

  const handleUpdateUser = async (user: any, name: string, password: string) => {
    setUserLoadingId(user.id);
    try {
      await indexdbUser.updateUser(user.id, { ...user, name, password });
      await loadAllUsers();
      alert(`Akun ${user.username} berhasil diperbarui!`);
    } catch (err) {
      alert('Gagal memperbarui akun.');
    } finally {
      setUserLoadingId(null);
    }
  };

  const handleDeleteUser = async (user: any) => {
    if (!confirm(`Hapus akun ${user.username}?`)) return;
    setUserLoadingId(user.id);
    try {
      await indexdbUser.deleteUser(user.id);
      await loadAllUsers();
    } catch (err) {
      alert('Gagal menghapus akun.');
    } finally {
      setUserLoadingId(null);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8 bg-slate-50 min-h-screen">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* Pengaturan Nota */}
        <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm space-y-6">
          <h3 className="font-black text-xl text-slate-800 tracking-tight">Informasi Nota Belanja</h3>
          <div className="space-y-4">
            <input
              type="text"
              value={localStoreInfo.name}
              onChange={(e) => setLocalStoreInfo({ ...localStoreInfo, name: e.target.value })}
              className="w-full bg-slate-50 border border-slate-100 p-4 rounded-2xl font-bold text-slate-700"
              placeholder="Nama Toko"
            />
            <input
              type="text"
              value={localStoreInfo.address}
              onChange={(e) => setLocalStoreInfo({ ...localStoreInfo, address: e.target.value })}
              className="w-full bg-slate-50 border border-slate-100 p-4 rounded-2xl font-bold text-slate-700"
              placeholder="Alamat Toko"
            />
            <input
              type="text"
              value={localStoreInfo.phone}
              onChange={(e) => setLocalStoreInfo({ ...localStoreInfo, phone: e.target.value })}
              className="w-full bg-slate-50 border border-slate-100 p-4 rounded-2xl font-bold text-slate-700"
              placeholder="No. Telepon"
            />
            <input
              type="text"
              value={localStoreInfo.footer}
              onChange={(e) => setLocalStoreInfo({ ...localStoreInfo, footer: e.target.value })}
              className="w-full bg-slate-50 border border-slate-100 p-4 rounded-2xl font-bold text-slate-700"
              placeholder="Pesan Kaki Nota"
            />
            <button
              onClick={handleSaveInfo}
              disabled={isSavingInfo}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-4 rounded-2xl font-black uppercase transition-all shadow-md"
            >
              {isSavingInfo ? 'Menyimpan...' : 'SIMPAN INFO TOKO'}
            </button>
          </div>
        </div>

        {/* Pengaturan Printer */}
        <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm space-y-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 shadow-inner">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9V2h12v7M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><path d="M6 14h12v8H6z"/></svg>
            </div>
            <div>
              <h3 className="font-black text-xl text-slate-800 tracking-tight">Printer Struk</h3>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Atur Ukuran Kertas</p>
            </div>
          </div>

          <div className="flex-1 space-y-4">
            <div className="p-6 bg-emerald-50/30 rounded-[28px] border border-emerald-100 flex items-center gap-4">
              <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-emerald-600 shadow-sm">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="m12 8-4 4 4 4M16 12H8"/></svg>
              </div>
              <div className="flex-1">
                <p className="text-sm font-black text-slate-700">Mode Web Print</p>
                <p className="text-[10px] text-emerald-600 font-black uppercase tracking-tight">Aktif</p>
              </div>
            </div>

            <div className="bg-slate-50 p-5 rounded-[24px] space-y-2">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Informasi Sistem</p>
              <p className="text-[11px] text-slate-500 leading-relaxed font-medium">
                Pastikan printer termal Anda sudah terdeteksi di sistem (Windows) atau genggaman Anda.
              </p>
            </div>

            <div className="bg-slate-50 p-5 rounded-[24px] space-y-4">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Pilih Ukuran Kertas</p>
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
                    localPrinter.paperWidthMm === 80
                      ? 'bg-slate-900 text-white border-slate-900'
                      : 'bg-white text-slate-700 border-slate-200 hover:border-emerald-400'
                  )}
                >
                  80mm
                </button>
              </div>
            </div>
          </div>
        </div>
        {/* 🗄️ PENGATURAN DATABASE */}
        <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm space-y-6 md:col-span-2">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-600 shadow-inner">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 12a9 9 0 0 1 9-9 9 9 0 0 1 9 9c0 4.97-4.03 9-9 9A9 9 0 0 1 3 12z"/><path d="M12 22V12H2"/></svg>
            </div>
            <div>
              <h3 className="font-black text-xl text-slate-800 tracking-tight">Manajemen Database & Sinkronisasi</h3>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Sinkronisasi Lokal (IndexedDB) dengan Cloud Supabase</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Tombol Sinkronisasi Cloud */}
            <button
              type="button"
              onClick={() => {
                alert('Memulai sinkronisasi data ke Supabase...');
                // Di sini panggil fungsi sync data Mas Ferry (misal: syncIndexedDBWithSupabase())
              }}
              className="p-5 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white rounded-2xl font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-3 shadow-md"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/></svg>
              SINKRONISASI KE SUPABASE
            </button>

            {/* Tombol Reset Data Lokal */}
            <button
              type="button"
              onClick={() => {
                if (confirm('PERINGATAN! Semua data lokal di aplikasi ini akan dihapus permanen. Anda yakin?')) {
                  localStorage.clear();
                  // Jika menggunakan IndexedDB asli, panggil fungsi hapus store di sini
                  alert('Data lokal berhasil dibersihkan! Aplikasi akan dimuat ulang.');
                  window.location.reload();
                }
              }}
              className="p-5 bg-red-50 hover:bg-red-100 text-red-600 rounded-2xl font-black text-xs uppercase tracking-wider transition-all border border-red-200 flex items-center justify-center gap-3"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
              WIPE / RESET DATA LOKAL
            </button>
          </div>
        </div>

        {/* ✅ MANAJEMEN PENGGUNA */}
        <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm space-y-6 md:col-span-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 shadow-inner">
                <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
              </div>
              <div>
                <h3 className="font-black text-xl text-slate-800 tracking-tight">Pengaturan Seluruh Akun</h3>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Ubah Nama dan Password untuk Semua Pengguna</p>
              </div>
            </div>
            
            <button
              onClick={() => setShowAddUser(!showAddUser)}
              className="px-5 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/></svg>
              {showAddUser ? 'TUTUP FORM' : 'DAFTARKAN AKUN KASIR/ADMIN'}
            </button>
          </div>

          {showAddUser && (
            <div className="p-6 bg-slate-50/50 rounded-3xl border border-slate-100 space-y-4">
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Form Registrasi Pengguna Baru</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">Username (Unik)</label>
                  <input
                    type="text"
                    placeholder="Contoh: kasir2"
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value)}
                    className="w-full bg-white border border-slate-200 p-4 rounded-2xl font-bold text-slate-700 text-xs focus:border-indigo-600 outline-none transition-all"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">Nama Lengkap</label>
                  <input
                    type="text"
                    placeholder="Contoh: Muhammad Rafli"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="w-full bg-white border border-slate-200 p-4 rounded-2xl font-bold text-slate-700 text-xs focus:border-indigo-600 outline-none transition-all"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">Password</label>
                  <input
                    type="text"
                    placeholder="Contoh: passwordpos"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full bg-white border border-slate-200 p-4 rounded-2xl font-bold text-slate-700 text-xs focus:border-indigo-600 outline-none transition-all"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">Hak Akses (Role)</label>
                  <select
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value as 'admin' | 'kasir' | 'gudang')}
                    className="w-full bg-white border border-slate-200 p-4 rounded-2xl font-black text-slate-700 text-xs focus:border-indigo-600 outline-none transition-all"
                  >
                    <option value="kasir">Kasir (Pegawai)</option>
                    <option value="gudang">Helper / Gudang</option>
                    <option value="admin">Admin (Full Akses)</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={handleCreateUser}
                  disabled={userLoadingId !== null}
                  className="px-6 py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {userLoadingId === 'new_user_action' && (
                    <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  )}
                  DAFTARKAN AKUN BARU
                </button>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
            {users.map((u) => {
              const isCurrentUser = indexdbUser.getCurrentUser()?.id === u.id;
              return (
                <UserCard
                  key={u.id}
                  user={u}
                  onSave={handleUpdateUser}
                  onDelete={handleDeleteUser}
                  isCurrentUser={isCurrentUser}
                  isLoading={userLoadingId === u.id}
                />
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
};

interface UserCardProps {
  user: any;
  onSave: (user: any, name: string, password: string) => Promise<void>;
  onDelete: (user: any) => Promise<void>;
  isCurrentUser: boolean;
  isLoading: boolean;
}

const UserCard: React.FC<UserCardProps> = ({ user, onSave, onDelete, isCurrentUser, isLoading }) => {
  const [name, setName] = useState(user.name);
  const [password, setPassword] = useState(user.password || '');
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className={cn(
      "p-6 rounded-[28px] border transition-all flex flex-col justify-between space-y-4 shadow-sm",
      isCurrentUser 
        ? "bg-indigo-50/50 border-indigo-200"
        : "bg-slate-50/50 border-slate-100 hover:border-slate-200"
    )}>
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className={cn(
            "w-11 h-11 rounded-xl flex items-center justify-center font-black text-xs uppercase shadow-inner",
            user.role === 'admin' 
              ? "bg-indigo-600 text-white" 
              : user.role === 'gudang'
                ? "bg-amber-500 text-white"
                : "bg-emerald-500 text-white"
          )}>
            {user.username.slice(0, 2)}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-sm text-slate-800 uppercase tracking-tight">{user.username}</span>
              <span className={cn(
                "text-[7px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-md leading-none",
                user.role === 'admin' 
                  ? "bg-indigo-100 text-indigo-700" 
                  : user.role === 'gudang'
                    ? "bg-amber-100 text-amber-700"
                    : "bg-emerald-100 text-emerald-700"
              )}>
                {user.role}
              </span>
            </div>
            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">
              ID: {user.id}
            </p>
          </div>
        </div>

        {isCurrentUser && (
          <span className="text-[8px] font-black text-indigo-600 bg-indigo-100/50 border border-indigo-200 px-2 py-1 rounded-lg uppercase tracking-wider leading-none shadow-sm">
            Sesi Aktif Anda
          </span>
        )}
      </div>

      <div className="space-y-3">
        <div className="space-y-1">
          <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">Nama Lengkap</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full bg-white border border-slate-200 p-3.5 rounded-2xl font-bold text-slate-700 text-xs focus:border-indigo-600 outline-none transition-all"
          />
        </div>
        <div className="space-y-1">
          <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">Password Baru</label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-white border border-slate-200 p-3.5 pr-14 rounded-2xl font-bold text-slate-700 text-xs focus:border-indigo-600 outline-none transition-all"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[9px] font-black uppercase tracking-widest text-slate-400"
            >
              {showPassword ? "Tutup" : "Lihat"}
            </button>
          </div>
        </div>
      </div>

      <div className="flex gap-2 pt-2 border-t border-slate-200/40">
        <button
          type="button"
          onClick={() => onSave(user, name, password)}
          disabled={isLoading || !name.trim() || !password.trim()}
          className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black text-[10px] uppercase tracking-wider transition-all disabled:opacity-50 active:scale-95 flex items-center justify-center gap-2 shadow-md shadow-indigo-50"
        >
          {isLoading ? (
            <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
          )}
          SIMPAN
        </button>

        {!isCurrentUser && user.id !== 'user_admin' && (
          <button
            type="button"
            onClick={() => onDelete(user)}
            disabled={isLoading}
            className="px-4 py-3 bg-red-50 hover:bg-red-100 text-red-500 rounded-2xl font-black text-xs uppercase transition-all flex items-center justify-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
          </button>
        )}
      </div>
    </div>
  );
};

export default SettingsPage;
