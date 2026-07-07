/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * IndexedDB Service untuk Manajemen User & Autentikasi - Offline Only
 * Role: admin (full akses), kasir (terbatas), gudang
 */

export interface User {
  id: string;
  username: string;
  password: string; // plain text (offline-only, no server)
  name: string;
  role: 'admin' | 'kasir' | 'gudang';
  isActive: boolean;
  created_at: number;
  updated_at: number;
}

class IndexDBUser {
  private dbName: string = "userDB";
  private storeName: string = "users";
  private db: IDBDatabase | null = null;
  private currentUser: { id: string; name: string; username: string; role: 'admin' | 'kasir' | 'gudang' } | null = null;

  constructor() {
    this.initDb();
    const stored = localStorage.getItem('pos_current_user');
    if (stored) {
      try {
        this.currentUser = JSON.parse(stored);
      } catch (e) {
        this.currentUser = null;
      }
    }
  }

  private initDb(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.db) { resolve(); return; }
      const request = indexedDB.open(this.dbName, 1);
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(this.storeName)) {
          const store = db.createObjectStore(this.storeName, { keyPath: "id" });
          store.createIndex("username", "username", { unique: true });
        }
      };
      request.onsuccess = (event) => {
        this.db = (event.target as IDBOpenDBRequest).result;
        this.seedAdmin();
        resolve();
      };
      request.onerror = (event) => {
        console.error("userDB error:", (event.target as IDBOpenDBRequest).error);
        reject((event.target as IDBOpenDBRequest).error);
      };
    });
  }

  private async seedAdmin() {
    try {
      const all = await this.getAll();
      if (all.length === 0) {
        await this.save({
          id: 'user_admin',
          username: 'admin',
          password: 'admin123',
          name: 'Administrator',
          role: 'admin',
          isActive: true,
          created_at: Date.now(),
          updated_at: Date.now(),
        });
        await this.save({
          id: 'user_kasir',
          username: 'kasir',
          password: 'kasir123',
          name: 'Kasir Pegawai',
          role: 'kasir',
          isActive: true,
          created_at: Date.now(),
          updated_at: Date.now(),
        });
        await this.save({
          id: 'user_gudang',
          username: 'gudang',
          password: 'gudang123',
          name: 'Staf Gudang / Helper',
          role: 'gudang',
          isActive: true,
          created_at: Date.now(),
          updated_at: Date.now(),
        });
        console.log('✅ User default dibuat: Admin (admin/admin123), Kasir (kasir/kasir123), Gudang (gudang/gudang123)');
      }
    } catch (e) {
      console.error('Seed users error:', e);
    }
  }

  private getObjectStore(mode: IDBTransactionMode): IDBObjectStore {
    if (!this.db) throw new Error("DB not init");
    return this.db.transaction(this.storeName, mode).objectStore(this.storeName);
  }

  async getAll(): Promise<User[]> {
    await this.initDb();
    return new Promise((resolve, reject) => {
      const req = this.getObjectStore("readonly").getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
  }

  async save(u: User): Promise<void> {
    await this.initDb();
    return new Promise((resolve, reject) => {
      const req = this.getObjectStore("readwrite").put({...u, updated_at: Date.now()});
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  async delete(id: string): Promise<void> {
    await this.initDb();
    return new Promise((resolve, reject) => {
      const req = this.getObjectStore("readwrite").delete(id);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  async login(username: string, password: string): Promise<{ success: boolean; user?: any; error?: string }> {
    await this.initDb();
    const all = await this.getAll();
    const user = all.find(u => u.username === username.trim());

    if (!user) return { success: false, error: 'Username tidak ditemukan' };
    if (!user.isActive) return { success: false, error: 'Akun ini sudah dinonaktifkan' };
    if (user.password !== password) return { success: false, error: 'Password salah' };

    this.currentUser = {
      id: user.id,
      name: user.name,
      username: user.username,
      role: user.role,
    };

    localStorage.setItem('pos_current_user', JSON.stringify(this.currentUser));
    return { success: true, user: this.currentUser };
  }

  logout() {
    this.currentUser = null;
    localStorage.removeItem('pos_current_user');
  }

  getCurrentUser() {
    return this.currentUser;
  }

  isLoggedIn(): boolean {
    return this.currentUser !== null;
  }

  isAdmin(): boolean {
    return this.getCurrentUser()?.role === 'admin';
  }

  async clearAll(): Promise<void> {
    await this.initDb();
    return new Promise((resolve, reject) => {
      const req = this.getObjectStore("readwrite").clear();
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  generateId(): string { return `user_${Date.now()}_${Math.random().toString(36).slice(2,6)}`; }
}

export const indexdbUser = new IndexDBUser();