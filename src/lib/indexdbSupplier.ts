/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * IndexedDB Service untuk Data Supplier - Offline Only
 */

export interface Supplier {
  id: string;
  name: string;
  phone: string;
  address: string;
  contactPerson: string;
  npwp: string;
  notes: string;
  productCount: number;
  totalPurchases: number;
  created_at: number;
  updated_at: number;
}

class IndexDBSupplier {
  private dbName: string = "supplierDB";
  private storeName: string = "suppliers";
  private db: IDBDatabase | null = null;
  private initPromise: Promise<void> | null = null;

  private initDb(): Promise<void> {
    if (this.initPromise) return this.initPromise;
    this.initPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, 1);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(this.storeName)) {
          const store = db.createObjectStore(this.storeName, { keyPath: "id" });
          store.createIndex("name", "name", { unique: false });
          store.createIndex("phone", "phone", { unique: false });
        }
      };

      request.onsuccess = (event) => {
        this.db = (event.target as IDBOpenDBRequest).result;
        resolve();
      };

      request.onerror = (event) => {
        console.error("IndexedDB supplierDB error:", (event.target as IDBOpenDBRequest).error);
        reject((event.target as IDBOpenDBRequest).error);
      };
    });
    return this.initPromise;
  }

  private getObjectStore(mode: IDBTransactionMode): IDBObjectStore {
    if (!this.db) {
      throw new Error("Database supplier not initialized.");
    }
    const transaction = this.db.transaction(this.storeName, mode);
    return transaction.objectStore(this.storeName);
  }

  async getAll(): Promise<Supplier[]> {
    await this.initDb();
    return new Promise((resolve, reject) => {
      try {
        const store = this.getObjectStore("readonly");
        const request = store.getAll();
        request.onsuccess = () => resolve(request.result || []);
        request.onerror = () => reject(request.error);
      } catch (e) {
        reject(e);
      }
    });
  }

  async getById(id: string): Promise<Supplier | undefined> {
    await this.initDb();
    return new Promise((resolve, reject) => {
      const store = this.getObjectStore("readonly");
      const request = store.get(id);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async save(supplier: Supplier): Promise<void> {
    if (!supplier.id) {
      throw new Error("Supplier id is required");
    }

    const freshSupplier = {
      ...supplier,
      phone: supplier.phone || '',
      address: supplier.address || '',
      contactPerson: supplier.contactPerson || '',
      npwp: supplier.npwp || '',
      notes: supplier.notes || '',
      productCount: Number(supplier.productCount || 0),
      totalPurchases: Number(supplier.totalPurchases || 0),
      created_at: supplier.created_at || Date.now(),
      updated_at: Date.now(),
    };

    await this.initDb();
    return new Promise((resolve, reject) => {
      const store = this.getObjectStore("readwrite");
      const request = store.put(freshSupplier);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async delete(id: string): Promise<void> {
    await this.initDb();
    return new Promise((resolve, reject) => {
      const store = this.getObjectStore("readwrite");
      const request = store.delete(id);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async search(query: string): Promise<Supplier[]> {
    const all = await this.getAll();
    const q = query.toLowerCase().trim();
    return all.filter(
      (s: Supplier) =>
        s.name?.toLowerCase().includes(q) ||
        s.phone?.includes(query) ||
        s.npwp?.includes(query) ||
        s.contactPerson?.toLowerCase().includes(q) ||
        s.address?.toLowerCase().includes(q)
    );
  }

  async count(): Promise<number> {
    await this.initDb();
    return new Promise((resolve, reject) => {
      const store = this.getObjectStore("readonly");
      const request = store.count();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async clearAll(): Promise<void> {
    await this.initDb();
    return new Promise((resolve, reject) => {
      const store = this.getObjectStore("readwrite");
      const request = store.clear();
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }
}

export const indexdbSupplier = new IndexDBSupplier();