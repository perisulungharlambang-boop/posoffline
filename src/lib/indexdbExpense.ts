/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * IndexedDB Service untuk Pengeluaran (Expense) - Offline Only
 */

export interface Expense {
  id: string;
  name: string;
  amount: number;
  category: string;
  date: number;
  notes: string;
  created_at: number;
  updated_at: number;
}

export const EXPENSE_CATEGORIES = [
  'Listrik',
  'Air',
  'Internet',
  'Sewa Tempat',
  'Gaji Karyawan',
  'Perlengkapan',
  'Maintenance',
  'Transportasi',
  'Pemasaran',
  'Lainnya',
];

class IndexDBExpense {
  private dbName: string = "expenseDB";
  private storeName: string = "expenses";
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
          store.createIndex("date", "date", { unique: false });
          store.createIndex("category", "category", { unique: false });
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

  async getAll(): Promise<Expense[]> {
    await this.initDb();
    return new Promise((resolve, reject) => {
      const store = this.getObjectStore("readonly");
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }

  async getById(id: string): Promise<Expense | undefined> {
    await this.initDb();
    return new Promise((resolve, reject) => {
      const store = this.getObjectStore("readonly");
      const request = store.get(id);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async save(expense: Expense): Promise<void> {
    await this.initDb();
    return new Promise((resolve, reject) => {
      const store = this.getObjectStore("readwrite");
      const request = store.put({
        ...expense,
        updated_at: Date.now(),
      });
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

  async getTotalByCategory(): Promise<Record<string, number>> {
    const all = await this.getAll();
    const result: Record<string, number> = {};
    for (const e of all) {
      result[e.category] = (result[e.category] || 0) + e.amount;
    }
    return result;
  }

  async getMonthlyTotal(year: number, month: number): Promise<number> {
    const all = await this.getAll();
    const start = new Date(year, month - 1, 1).getTime();
    const end = new Date(year, month, 0, 23, 59, 59).getTime();
    return all
      .filter(e => e.date >= start && e.date <= end)
      .reduce((sum, e) => sum + e.amount, 0);
  }

  async search(query: string): Promise<Expense[]> {
    const all = await this.getAll();
    const q = query.toLowerCase().trim();
    return all.filter(e =>
      e.name.toLowerCase().includes(q) ||
      e.category.toLowerCase().includes(q) ||
      e.notes.toLowerCase().includes(q)
    );
  }

  async clearAll(): Promise<void> {
    await this.initDb();
    return new Promise((resolve, reject) => {
      const req = this.getObjectStore("readwrite").clear();
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  generateId(): string {
    return `exp_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  }
}

export const indexdbExpense = new IndexDBExpense();