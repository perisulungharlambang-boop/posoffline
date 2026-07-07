/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * OfflineFirst Database Adapter - Offline IndexedDB Only
 */

import { offlineDB, Product, Customer, Supplier, Transaction, Restock, Retur } from '@/lib/dexieDb';
import { createProduct, createCustomer, createSupplier, updateEntity } from '@/lib/entityBuilders';
import { generateUUID } from '@/lib/uuidGenerator';

/**
 * Product Adapter - Specialized untuk Products table
 */
export class ProductAdapter {
  async getAll(): Promise<Product[]> {
    try {
      return await offlineDB.products.toArray();
    } catch (error) {
      console.error('Error getting all products:', error);
      return [];
    }
  }

  async getById(id: string): Promise<Product | undefined> {
    return offlineDB.products.get(id);
  }

  async create(data: Omit<Product, 'id' | 'updated_at' | 'created_at'>): Promise<Product> {
    const product = createProduct(data);
    await offlineDB.products.put(product);
    return product;
  }

  async update(id: string, data: Partial<Product>): Promise<Product | undefined> {
    const existing = await offlineDB.products.get(id);
    if (!existing) return undefined;

    const updated = updateEntity(existing, data);
    await offlineDB.products.put(updated);
    return updated;
  }

  async delete(id: string): Promise<void> {
    await offlineDB.products.delete(id);
  }

  async getByCategory(category: string): Promise<Product[]> {
    const all = await this.getAll();
    return all.filter((p) => p.category === category);
  }

  async getBySupplier(supplierId: string): Promise<Product[]> {
    const all = await this.getAll();
    return all.filter((p) => p.supplierId === supplierId);
  }

  async getLowStock(threshold: number = 10): Promise<Product[]> {
    const all = await this.getAll();
    return all.filter((p) => p.stock < threshold);
  }

  async createBatch(items: Omit<Product, 'id' | 'updated_at' | 'created_at'>[]): Promise<Product[]> {
    const products = items.map(createProduct);
    await offlineDB.products.bulkPut(products);
    return products;
  }
}

/**
 * Customer Adapter
 */
export class CustomerAdapter {
  async getAll(): Promise<Customer[]> {
    try {
      return await offlineDB.customers.toArray();
    } catch (error) {
      console.error('Error getting all customers:', error);
      return [];
    }
  }

  async getById(id: string): Promise<Customer | undefined> {
    return offlineDB.customers.get(id);
  }

  async create(data: Omit<Customer, 'id' | 'updated_at' | 'created_at'>): Promise<Customer> {
    const customer = createCustomer(data);
    await offlineDB.customers.put(customer);
    return customer;
  }

  async update(id: string, data: Partial<Customer>): Promise<Customer | undefined> {
    const existing = await offlineDB.customers.get(id);
    if (!existing) return undefined;

    const updated = updateEntity(existing, data);
    await offlineDB.customers.put(updated);
    return updated;
  }

  async delete(id: string): Promise<void> {
    await offlineDB.customers.delete(id);
  }

  async getByPhone(phone: string): Promise<Customer | undefined> {
    const all = await this.getAll();
    return all.find((c) => c.phone === phone);
  }

  async getByEmail(email: string): Promise<Customer | undefined> {
    const all = await this.getAll();
    return all.find((c) => c.email === email);
  }

  async getByCity(city: string): Promise<Customer[]> {
    const all = await this.getAll();
    return all.filter((c) => c.city === city);
  }
}

/**
 * Supplier Adapter
 */
export class SupplierAdapter {
  async getAll(): Promise<Supplier[]> {
    try {
      return await offlineDB.suppliers.toArray();
    } catch (error) {
      console.error('Error getting all suppliers:', error);
      return [];
    }
  }

  async getById(id: string): Promise<Supplier | undefined> {
    return offlineDB.suppliers.get(id);
  }

  async create(data: Omit<Supplier, 'id' | 'updated_at' | 'created_at'>): Promise<Supplier> {
    const supplier = createSupplier(data);
    await offlineDB.suppliers.put(supplier);
    return supplier;
  }

  async update(id: string, data: Partial<Supplier>): Promise<Supplier | undefined> {
    const existing = await offlineDB.suppliers.get(id);
    if (!existing) return undefined;

    const updated = updateEntity(existing, data);
    await offlineDB.suppliers.put(updated);
    return updated;
  }

  async delete(id: string): Promise<void> {
    await offlineDB.suppliers.delete(id);
  }

  async getActive(): Promise<Supplier[]> {
    const all = await this.getAll();
    return all.filter((s) => s.is_active === true);
  }

  async getByEmail(email: string): Promise<Supplier | undefined> {
    const all = await this.getAll();
    return all.find((s) => s.email === email);
  }
}

/**
 * Transaction Adapter
 */
export class TransactionAdapter {
  async getAll(): Promise<Transaction[]> {
    try {
      return await offlineDB.transactions.toArray();
    } catch (error) {
      console.error('Error getting all transactions:', error);
      return [];
    }
  }

  async getById(id: string): Promise<Transaction | undefined> {
    return offlineDB.transactions.get(id);
  }

  async create(data: Omit<Transaction, 'id' | 'updated_at' | 'created_at'>): Promise<Transaction> {
    const transaction: Transaction = {
      id: generateUUID(),
      updated_at: Date.now(),
      created_at: Date.now(),
      ...data,
    };
    await offlineDB.transactions.put(transaction);
    return transaction;
  }

  async update(id: string, data: Partial<Transaction>): Promise<Transaction | undefined> {
    const existing = await offlineDB.transactions.get(id);
    if (!existing) return undefined;

    const updated = updateEntity(existing, data);
    await offlineDB.transactions.put(updated);
    return updated;
  }

  async delete(id: string): Promise<void> {
    await offlineDB.transactions.delete(id);
  }

  async getByCustomer(customerId: string): Promise<Transaction[]> {
    const all = await this.getAll();
    return all.filter((t) => t.customer_id === customerId);
  }

  async getByDate(startDate: number, endDate: number): Promise<Transaction[]> {
    const all = await this.getAll();
    return all.filter((t) => t.transaction_date >= startDate && t.transaction_date <= endDate);
  }

  async getByType(type: string): Promise<Transaction[]> {
    const all = await this.getAll();
    return all.filter((t) => t.transaction_type === (type as any));
  }

  async getTotalRevenue(): Promise<number> {
    const all = await this.getAll();
    return all
      .filter((t) => t.transaction_type === 'penjualan')
      .reduce((sum, t) => sum + t.total_amount, 0);
  }
}

/**
 * Restock Adapter
 */
export class RestockAdapter {
  async getAll(): Promise<Restock[]> {
    try {
      return await offlineDB.restocks.toArray();
    } catch (error) {
      console.error('Error getting all restocks:', error);
      return [];
    }
  }

  async getById(id: string): Promise<Restock | undefined> {
    return offlineDB.restocks.get(id);
  }

  async create(data: Omit<Restock, 'id' | 'updated_at' | 'created_at'>): Promise<Restock> {
    const restock: Restock = {
      id: generateUUID(),
      updated_at: Date.now(),
      created_at: Date.now(),
      ...data,
    };
    await offlineDB.restocks.put(restock);
    return restock;
  }

  async update(id: string, data: Partial<Restock>): Promise<Restock | undefined> {
    const existing = await offlineDB.restocks.get(id);
    if (!existing) return undefined;

    const updated = updateEntity(existing, data);
    await offlineDB.restocks.put(updated);
    return updated;
  }

  async delete(id: string): Promise<void> {
    await offlineDB.restocks.delete(id);
  }

  async getBySupplier(supplierId: string): Promise<Restock[]> {
    const all = await this.getAll();
    return all.filter((r) => r.supplier_id === supplierId);
  }

  async getByDate(startDate: number, endDate: number): Promise<Restock[]> {
    const all = await this.getAll();
    return all.filter((r) => r.restock_date >= startDate && r.restock_date <= endDate);
  }

  async getTotalExpense(): Promise<number> {
    const all = await this.getAll();
    return all
      .reduce((sum, r) => sum + r.total_amount, 0);
  }
}

/**
 * Retur Adapter
 */
export class ReturAdapter {
  async getAll(): Promise<Retur[]> {
    try {
      return await offlineDB.returs.toArray();
    } catch (error) {
      console.error('Error getting all returs:', error);
      return [];
    }
  }

  async getById(id: string): Promise<Retur | undefined> {
    return offlineDB.returs.get(id);
  }

  async create(data: Omit<Retur, 'id' | 'updated_at' | 'created_at'>): Promise<Retur> {
    const retur: Retur = {
      id: generateUUID(),
      updated_at: Date.now(),
      created_at: Date.now(),
      ...data,
    };
    await offlineDB.returs.put(retur);
    return retur;
  }

  async update(id: string, data: Partial<Retur>): Promise<Retur | undefined> {
    const existing = await offlineDB.returs.get(id);
    if (!existing) return undefined;

    const updated = updateEntity(existing, data);
    await offlineDB.returs.put(updated);
    return updated;
  }

  async delete(id: string): Promise<void> {
    await offlineDB.returs.delete(id);
  }

  async getByType(type: 'customer' | 'supplier'): Promise<Retur[]> {
    const all = await this.getAll();
    return all.filter((r) => r.retur_type === type);
  }

  async getByDate(startDate: number, endDate: number): Promise<Retur[]> {
    const all = await this.getAll();
    return all.filter((r) => r.retur_date >= startDate && r.retur_date <= endDate);
  }
}

/**
 * Export singletons untuk global use
 */
export const productAdapter = new ProductAdapter();
export const customerAdapter = new CustomerAdapter();
export const supplierAdapter = new SupplierAdapter();
export const transactionAdapter = new TransactionAdapter();
export const restockAdapter = new RestockAdapter();
export const returAdapter = new ReturAdapter();