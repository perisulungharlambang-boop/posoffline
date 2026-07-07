/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * IndexedDB Category Database Service - Offline Only
 */

class IndexDBCategory {
  private dbName: string = "categoryDB";
  private storeName: string = "categories";
  private db: IDBDatabase | null = null;
  private initPromise: Promise<void> | null = null;

  private initDb(): Promise<void> {
    if (this.initPromise) return this.initPromise;
    this.initPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, 1);
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(this.storeName)) {
          db.createObjectStore(this.storeName, { keyPath: "name" });
        }
      };
      request.onsuccess = (event) => {
        this.db = (event.target as IDBOpenDBRequest).result;
        resolve();
      };
      request.onerror = (event) => {
        reject((event.target as IDBOpenDBRequest).error);
      };
    });
    return this.initPromise;
  }

  private getObjectStore(mode: IDBTransactionMode): IDBObjectStore {
    if (!this.db) throw new Error("DB not init");
    return this.db.transaction(this.storeName, mode).objectStore(this.storeName);
  }

  async getAll(): Promise<string[]> {
    const defaults = ['Makanan', 'Minuman', 'Elektronik', 'Alat Tulis', 'Umum'];
    await this.initDb();
    return new Promise((resolve, reject) => {
      const store = this.getObjectStore("readonly");
      const request = store.getAll();
      request.onsuccess = () => {
        const data: { name: string }[] = request.result || [];
        const customNames = data.map((c: any) => c.name || c);
        const merged = [...new Set([...defaults, ...customNames])].sort();
        resolve(merged);
      };
      request.onerror = () => reject(request.error);
    });
  }

  async add(name: string): Promise<boolean> {
    const trimmed = name.trim();
    if (!trimmed) return false;

    await this.initDb();
    return new Promise((resolve, reject) => {
      const store = this.getObjectStore("readwrite");
      const request = store.put({ name: trimmed });
      request.onsuccess = () => resolve(true);
      request.onerror = () => {
        if (request.error?.name === 'ConstraintError') {
          resolve(false);
        } else {
          reject(request.error);
        }
      };
    });
  }

  async delete(name: string): Promise<boolean> {
    const defaults = ['Makanan', 'Minuman', 'Elektronik', 'Alat Tulis', 'Umum'];
    if (defaults.includes(name)) return false;

    await this.initDb();
    return new Promise((resolve, reject) => {
      const store = this.getObjectStore("readwrite");
      const request = store.delete(name);
      request.onsuccess = () => resolve(true);
      request.onerror = () => reject(request.error);
    });
  }

  async clearAll(): Promise<void> {
    await this.initDb();
    return new Promise((resolve, reject) => {
      const req = this.getObjectStore("readwrite").clear();
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }
}

export const indexdbCategory = new IndexDBCategory();