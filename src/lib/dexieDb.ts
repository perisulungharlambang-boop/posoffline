/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Dexie Database Schema untuk Offline-Only Storage
 * Menggunakan IndexedDB sebagai satu-satunya penyimpanan (tanpa sinkronisasi cloud)
 */

import Dexie, { Table } from 'dexie';

/**
 * Product/Barang Schema
 */
export interface Product {
  id: string;
  sku: string;
  name: string;
  category: string;
  priceRetail: number;
  priceWholesale: number;
  priceCost: number;
  stock: number;
  supplierId?: string;
  supplierName?: string;
  description?: string;
  barcode?: string;
  image_url?: string;
  updated_at: number;
  created_at?: number;
}

/**
 * Customer Schema
 */
export interface Customer {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  postal_code?: string;
  credit_limit?: number;
  credit_used?: number;
  notes?: string;
  updated_at: number;
  created_at?: number;
}

/**
 * Supplier Schema
 */
export interface Supplier {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  contact_person?: string;
  notes?: string;
  is_active: boolean;
  updated_at: number;
  created_at?: number;
}

/**
 * Transaction/Transaksi Schema
 */
export interface Transaction {
  id: string;
  transaction_type: 'penjualan' | 'pembelian' | 'retur' | 'adjustment';
  transaction_date: number;
  customer_id?: string;
  supplier_id?: string;
  items: TransactionItem[];
  total_amount: number;
  paid_amount: number;
  payment_method: string;
  notes?: string;
  cashier_id?: string;
  is_draft: boolean;
  updated_at: number;
  created_at?: number;
}

export interface TransactionItem {
  product_id: string;
  quantity: number;
  unit_price: number;
  discount?: number;
  subtotal: number;
}

/**
 * Restock Schema (Masuk)
 */
export interface Restock {
  id: string;
  restock_date: number;
  supplier_id: string;
  items: RestockItem[];
  total_amount: number;
  notes?: string;
  warehouse_id?: string;
  updated_at: number;
  created_at?: number;
}

export interface RestockItem {
  product_id: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
}

/**
 * Retur Schema
 */
export interface Retur {
  id: string;
  retur_date: number;
  retur_type: 'customer' | 'supplier';
  reference_id?: string;
  items: ReturItem[];
  total_amount: number;
  reason?: string;
  notes?: string;
  updated_at: number;
  created_at?: number;
}

export interface ReturItem {
  product_id: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
}

/**
 * Dexie Database Class - Offline Only
 */
export class OfflineFirstDB extends Dexie {
  products!: Table<Product>;
  customers!: Table<Customer>;
  suppliers!: Table<Supplier>;
  transactions!: Table<Transaction>;
  restocks!: Table<Restock>;
  returs!: Table<Retur>;

  constructor() {
    super('PosPro_OfflineDB');
    this.version(1).stores({
      products: 'id, updated_at, category, sku',
      customers: 'id, updated_at, phone, email',
      suppliers: 'id, updated_at, email',
      transactions: 'id, updated_at, transaction_date, customer_id',
      restocks: 'id, updated_at, restock_date, supplier_id',
      returs: 'id, updated_at, retur_date',
    });
  }
}

// Export singleton instance
export const offlineDB = new OfflineFirstDB();