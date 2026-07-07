/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Product Database Service - Offline IndexedDB Only
 * Menggunakan IndexedDB sebagai satu-satunya penyimpanan
 */

import defaultData from "../services/db/DefaultData.json";
import { generateUUID } from './uuidGenerator';

class IndexDBBarang {
  private dbName: string = "barangDB";
  private storeName: string = "barang";
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
        this.seedData();
        resolve();
      };
      request.onerror = (event) => {
        reject((event.target as IDBOpenDBRequest).error);
      };
    });
    return this.initPromise;
  }

  private async seedData(): Promise<void> {
    try {
      const total = await this.count();
      if (total > 0 || !defaultData.data.products) return;
      const products = defaultData.data.products;
      const transaction = this.db!.transaction(this.storeName, "readwrite");
      const store = transaction.objectStore(this.storeName);
      for (const p of products) {
        const item = p as any;
        const sku = (item.sku || item.barcode || '').toString().trim();
        const id = item.id || `prod_${sku.toLowerCase().replace(/[^a-z0-9\-_]/g, ".")}`;
        const record = {
          id,
          name: item.name || '',
          sku,
          barcode: item.barcode || sku,
          category: item.category || 'Umum',
          priceRetail: item.priceRetail || item.price || 0,
          priceWholesale: item.priceWholesale || item.wholesale_price || 0,
          priceCost: item.priceCost || item.capitalPrice || 0,
          stock: item.stock || 0,
          min_stock: item.min_stock || 0,
          created_at: Date.now(),
          updated_at: Date.now()
        };
        store.add(record);
      }
    } catch (e) {
      console.error("Seed error products:", e);
    }
  }

  private getObjectStore(mode: IDBTransactionMode): IDBObjectStore {
    if (!this.db) throw new Error("DB not init");
    return this.db.transaction(this.storeName, mode).objectStore(this.storeName);
  }

  async addBarang(barang: any): Promise<number> {
    await this.initDb();
    return new Promise((resolve, reject) => {
      const req = this.getObjectStore("readwrite").add(barang);
      req.onsuccess = () => resolve(req.result as number);
      req.onerror = () => reject(req.error);
    });
  }

  async getBarang(id: string | number): Promise<any> {
    await this.initDb();
    return new Promise((resolve, reject) => {
      const req = this.getObjectStore("readonly").get(id);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }

  async getAllBarang(): Promise<any[]> {
    await this.initDb();
    return new Promise((resolve, reject) => {
      const req = this.getObjectStore("readonly").getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
  }

  async updateBarang(barang: any): Promise<void> {
    if (!barang.id && barang.id !== 0) {
      throw new Error("updateBarang: id wajib diisi.");
    }
    await this.initDb();
    return new Promise((resolve, reject) => {
      const req = this.getObjectStore("readwrite").put({
        ...barang,
        updated_at: barang.updated_at || Date.now()
      });
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  async deleteBarang(id: string | number): Promise<void> {
    await this.initDb();
    return new Promise((resolve, reject) => {
      const req = this.getObjectStore("readwrite").delete(id);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  async count(): Promise<number> {
    await this.initDb();
    return new Promise((resolve, reject) => {
      const req = this.getObjectStore("readonly").count();
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }

  async getPaged(offset: number, limit: number): Promise<any[]> {
    await this.initDb();
    return new Promise((resolve, reject) => {
      const req = this.getObjectStore("readonly").getAll();
      req.onsuccess = () => {
        resolve((req.result || []).slice(offset, offset + limit));
      };
      req.onerror = () => reject(req.error);
    });
  }

  async search(query: string): Promise<any[]> {
    await this.initDb();
    return new Promise((resolve, reject) => {
      const req = this.getObjectStore("readonly").getAll();
      req.onsuccess = () => {
        const q = query.toLowerCase().trim();
        const results = (req.result || []).filter(p => 
          p.name?.toLowerCase().includes(q) || 
          p.barcode?.includes(query) || 
          p.sku?.includes(query)
        );
        resolve(results);
      };
      req.onerror = () => reject(req.error);
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

  async migrateIds(): Promise<{ migrated: number; skipped: number }> {
    await this.initDb();
    const all = await this.getAllBarang();
    let migrated = 0;
    let skipped = 0;
    for (const p of all) {
      const sku = (p.sku || p.barcode || '').toString().trim();
      if (typeof p.id === 'string' && p.id.startsWith('prod_')) {
        skipped++;
        continue;
      }
      const newId = sku ? `prod_${sku.toLowerCase().replace(/[^a-z0-9\-_]/g, ".")}` : `prod_no_sku_${generateUUID()}`;
      await this.deleteBarang(p.id);
      await this.updateBarang({ ...p, id: newId });
      migrated++;
    }
    return { migrated, skipped };
  }

  async deduplicateBySku(): Promise<{ removed: number; kept: number }> {
    await this.initDb();
    const all = await this.getAllBarang();
    const byKey = new Map<string, any[]>();
    for (const p of all) {
      const key = (p.sku || p.barcode || '').toString().trim();
      if (!key) continue;
      if (!byKey.has(key)) byKey.set(key, []);
      byKey.get(key)!.push(p);
    }
    let removed = 0;
    for (const [, group] of byKey) {
      if (group.length <= 1) continue;
      group.sort((a, b) => b.updated_at - a.updated_at);
      for (let i = 1; i < group.length; i++) {
        await this.deleteBarang(group[i].id);
        removed++;
      }
    }
    return { removed, kept: all.length - removed };
  }
}

export const indexdbBarang = new IndexDBBarang();