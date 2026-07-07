/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * DATABASE SERVICE UNTUK APLIKASI POS - WEB ONLY
 * IndexedDB sebagai satu-satunya penyimpanan (Offline Only)
 */

import { indexdbBarang } from '@/lib/indexdbBarang';
import { indexdbTransaksi } from '@/lib/indexdbTransaksi';
import { indexdbCustomer } from '@/lib/indexdbCustomer';
import { indexdbSupplier } from '@/lib/indexdbSupplier';
import { indexdbCategory } from '@/lib/indexdbCategory';
import { indexdbDebt } from '@/lib/indexdbDebt';
import { indexdbDiscount } from '@/lib/indexdbDiscount';
import { indexdbExpense } from '@/lib/indexdbExpense';
import { indexdbRestock } from '@/lib/indexdbRestock';
import { indexdbRetur } from '@/lib/indexdbRetur';
import { indexdbUser } from '@/lib/indexdbUser';
import { useSettingsStore } from '@/store/useSettingsStore';
import { generateProductId } from '@/lib/utils';
import { generateUUID } from '@/lib/uuidGenerator';

class DatabaseService {
  private isInitialized = false;

  constructor() {}

  async init(): Promise<boolean> {
    if (this.isInitialized) return true;

    try {
      console.log("✅ Berjalan di browser, menggunakan IndexedDB untuk storage");
      this.isInitialized = true;
      return true;
    } catch (error) {
      console.error("❌ Gagal inisialisasi Database:", error);
      return false;
    }
  }

  async backupToJSON(): Promise<any> {
    await this.init();

    const products = await indexdbBarang.getAllBarang();
    const transactions = await indexdbTransaksi.getAll();
    const customers = await indexdbCustomer.getAll();
    const suppliers = await indexdbSupplier.getAll();
    const categories = await indexdbCategory.getAll();
    const debts = await indexdbDebt.getAll();
    const discounts = await indexdbDiscount.getAll();
    const expenses = await indexdbExpense.getAll();
    const restocks = await indexdbRestock.getAll();
    const returs = await indexdbRetur.getAll();
    const users = await indexdbUser.getAll();

    const settings = useSettingsStore.getState();
    const settingsData = {
      storeInfo: settings.storeInfo,
      printer: null
    };

    return {
      version: 1,
      exported_at: new Date().toISOString(),
      products,
      transactions,
      customers,
      suppliers,
      categories,
      debts,
      discounts,
      expenses,
      restocks,
      returs,
      users,
      settings: settingsData.storeInfo ? { storeInfo: settingsData.storeInfo, printer: null } : settingsData
    };
  }

  async restoreFromJSON(data: any): Promise<boolean> {
    try {
      if (data.products && Array.isArray(data.products)) {
        await indexdbBarang.clearAll();
        for (const p of data.products) {
          await indexdbBarang.updateBarang(p);
        }
      }

      if (data.transactions && Array.isArray(data.transactions)) {
        await indexdbTransaksi.clearAll();
        for (const trx of data.transactions) {
          await indexdbTransaksi.createRaw(trx);
        }
      }

      if (data.customers && Array.isArray(data.customers)) {
        await indexdbCustomer.clearAll();
        for (const c of data.customers) {
          await indexdbCustomer.save(c);
        }
      }

      if (data.suppliers && Array.isArray(data.suppliers)) {
        await indexdbSupplier.clearAll();
        for (const s of data.suppliers) {
          await indexdbSupplier.save(s);
        }
      }

      if (data.categories && Array.isArray(data.categories)) {
        await indexdbCategory.clearAll();
        for (const cat of data.categories) {
          await indexdbCategory.add(cat);
        }
      }

      if (data.debts && Array.isArray(data.debts)) {
        await indexdbDebt.clearAll();
        for (const d of data.debts) {
          await indexdbDebt.save(d);
        }
      }

      if (data.discounts && Array.isArray(data.discounts)) {
        await indexdbDiscount.clearAll();
        for (const d of data.discounts) {
          await indexdbDiscount.save(d);
        }
      }

      if (data.expenses && Array.isArray(data.expenses)) {
        await indexdbExpense.clearAll();
        for (const e of data.expenses) {
          await indexdbExpense.save(e);
        }
      }

      if (data.restocks && Array.isArray(data.restocks)) {
        await indexdbRestock.clearAll();
        for (const r of data.restocks) {
          await indexdbRestock.add(r);
        }
      }

      if (data.returs && Array.isArray(data.returs)) {
        await indexdbRetur.clearAll();
        for (const r of data.returs) {
          await indexdbRetur.add(r);
        }
      }

      if (data.users && Array.isArray(data.users)) {
        await indexdbUser.clearAll();
        for (const u of data.users) {
          await indexdbUser.save(u);
        }
      }

      if (data.settings?.storeInfo) {
        useSettingsStore.getState().updateStoreInfo(data.settings.storeInfo);
      }

      return true;
    } catch (e) {
      console.error("Restore error:", e);
      return false;
    }
  }

  async resetTransactionData(): Promise<boolean> {
    try {
      await indexdbTransaksi.clearAll();
      return true;
    } catch (e) {
      console.error("Reset transaksi error:", e);
      return false;
    }
  }

  async exportData(): Promise<string> {
    const data = await this.backupToJSON();
    return JSON.stringify(data, null, 2);
  }

  async importData(json: string): Promise<boolean> {
    try {
      const data = JSON.parse(json);
      return this.restoreFromJSON(data);
    } catch (e) {
      console.error("Import error:", e);
      return false;
    }
  }

  async importProducts(products: any[]): Promise<{ success: number; error: number; total: number }> {
    let successCount = 0;
    let errorCount = 0;

    for (const product of products) {
      try {
        let finalProductId = product.id;

        if (!finalProductId) {
          const tempId = generateProductId(product.sku, product.barcode);
          if (await indexdbBarang.getBarang(tempId)) {
            finalProductId = `prod_autogen_${generateUUID()}`;
          } else {
            finalProductId = tempId;
          }
        }

        const productToSave = { ...product, id: finalProductId };
        await indexdbBarang.updateBarang(productToSave);
        successCount++;
      } catch (err) {
        errorCount++;
        console.error("❌ Error import produk:", product?.name || product?.id, err);
      }
    }

    console.log(`✅ Import selesai: ${successCount} berhasil, ${errorCount} gagal dari ${products.length} total`);

    return {
      success: successCount,
      error: errorCount,
      total: successCount + errorCount
    };
  }

  async getInstance(): Promise<this> {
    await this.init();
    return this;
  }
}

export const databaseService = new DatabaseService();
export const dbProvider = databaseService;