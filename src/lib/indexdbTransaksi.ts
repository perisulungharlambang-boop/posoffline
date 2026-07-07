/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Transaction / Sales Database Service - Offline IndexedDB Only
 */

class IndexDBTransaksi {
  private dbName: string = "transaksiDB";
  private storeName: string = "transaksi";
  private db: IDBDatabase | null = null;
  private initPromise: Promise<void> | null = null;

  private initDb(): Promise<void> {
    if (this.initPromise) return this.initPromise;
    this.initPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, 1);
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(this.storeName)) {
          db.createObjectStore(this.storeName, { keyPath: "id" });
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

  async create(total: number, items: any[], customerName?: string, paymentMethod?: string, paidAmount?: number, subtotal?: number, discountAmount?: number): Promise<string> {
    const id = `TRX-${Date.now()}`;
    const nowIso = new Date().toISOString();
    const pMethod = paymentMethod || 'cash';
    const pAmount = paidAmount !== undefined ? paidAmount : total;
    const cName = customerName || '';

    const transaksi = {
      id,
      total,
      subtotal: subtotal ?? total,
      discountAmount: discountAmount ?? 0,
      items,
      customerName: cName,
      paymentMethod: pMethod,
      paidAmount: pAmount,
      created_at: nowIso,
      is_synced: true
    };

    await this.initDb();
    return new Promise((resolve, reject) => {
      const store = this.getObjectStore("readwrite");
      const request = store.add(transaksi);
      request.onsuccess = () => resolve(id);
      request.onerror = () => reject(request.error);
    });
  }

  async getAll(): Promise<any[]> {
    await this.initDb();
    return new Promise((resolve, reject) => {
      const store = this.getObjectStore("readonly");
      const request = store.getAll();
      request.onsuccess = () => {
        const sorted = (request.result || []).sort((a: any, b: any) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
        resolve(sorted);
      };
      request.onerror = () => reject(request.error);
    });
  }

  async getById(id: string): Promise<any> {
    await this.initDb();
    return new Promise((resolve, reject) => {
      const store = this.getObjectStore("readonly");
      const request = store.get(id);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
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

  async delete(id: string): Promise<void> {
    await this.initDb();
    return new Promise((resolve, reject) => {
      const store = this.getObjectStore("readwrite");
      const request = store.delete(id);
      request.onsuccess = () => resolve();
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

  async createRaw(transaksi: any): Promise<void> {
    await this.initDb();
    return new Promise((resolve, reject) => {
      const store = this.getObjectStore("readwrite");
      const request = store.put(transaksi);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }
}

export const indexdbTransaksi = new IndexDBTransaksi();