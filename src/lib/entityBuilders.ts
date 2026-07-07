/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Entity Builders - Helper untuk create entities dengan format yang benar
 * Untuk Offline-Only IndexedDB (tanpa sync_status)
 */

import { generateUUID } from '@/lib/uuidGenerator';
import {
  Product,
  Customer,
  Supplier,
  Transaction,
  Restock,
  Retur,
  TransactionItem,
  RestockItem,
  ReturItem,
} from '@/lib/dexieDb';

/**
 * Builder untuk Product
 */
export const createProduct = (data: Omit<Product, 'id' | 'updated_at' | 'created_at'>): Product => ({
  id: generateUUID(),
  updated_at: Date.now(),
  created_at: Date.now(),
  ...data,
});

/**
 * Builder untuk Customer
 */
export const createCustomer = (data: Omit<Customer, 'id' | 'updated_at' | 'created_at'>): Customer => ({
  id: generateUUID(),
  updated_at: Date.now(),
  created_at: Date.now(),
  ...data,
});

/**
 * Builder untuk Supplier
 */
export const createSupplier = (data: Omit<Supplier, 'id' | 'updated_at' | 'created_at'>): Supplier => ({
  id: generateUUID(),
  updated_at: Date.now(),
  created_at: Date.now(),
  ...data,
});

/**
 * Builder untuk Transaction
 */
export const createTransaction = (
  data: Omit<Transaction, 'id' | 'updated_at' | 'created_at'>
): Transaction => ({
  id: generateUUID(),
  updated_at: Date.now(),
  created_at: Date.now(),
  ...data,
});

/**
 * Builder untuk Restock
 */
export const createRestock = (data: Omit<Restock, 'id' | 'updated_at' | 'created_at'>): Restock => ({
  id: generateUUID(),
  updated_at: Date.now(),
  created_at: Date.now(),
  ...data,
});

/**
 * Builder untuk Retur
 */
export const createRetur = (data: Omit<Retur, 'id' | 'updated_at' | 'created_at'>): Retur => ({
  id: generateUUID(),
  updated_at: Date.now(),
  created_at: Date.now(),
  ...data,
});

/**
 * Update entity dengan updated_at
 */
export const updateEntity = <T extends { updated_at: number }>(
  entity: T,
  updates: Partial<T>
): T => {
  return {
    ...entity,
    ...updates,
    updated_at: Date.now(),
  };
};

/**
 * Batch create products
 */
export const createProductsBatch = (
  items: Omit<Product, 'id' | 'updated_at' | 'created_at'>[]
): Product[] => {
  return items.map(createProduct);
};

/**
 * Helper untuk create transaction items dengan calculation
 */
export const createTransactionItem = (
  productId: string,
  quantity: number,
  unitPrice: number,
  discount: number = 0
): TransactionItem => {
  const subtotal = quantity * unitPrice - discount;
  return {
    product_id: productId,
    quantity,
    unit_price: unitPrice,
    discount,
    subtotal,
  };
};

/**
 * Helper untuk create restock items
 */
export const createRestockItem = (
  productId: string,
  quantity: number,
  unitPrice: number
): RestockItem => {
  const subtotal = quantity * unitPrice;
  return {
    product_id: productId,
    quantity,
    unit_price: unitPrice,
    subtotal,
  };
};

/**
 * Helper untuk create retur items
 */
export const createReturItem = (
  productId: string,
  quantity: number,
  unitPrice: number
): ReturItem => {
  const subtotal = quantity * unitPrice;
  return {
    product_id: productId,
    quantity,
    unit_price: unitPrice,
    subtotal,
  };
};

/**
 * Calculate total dari items
 */
export const calculateTotal = (items: { subtotal: number }[]): number => {
  return items.reduce((sum, item) => sum + item.subtotal, 0);
};