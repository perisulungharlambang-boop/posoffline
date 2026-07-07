/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Transaction Service - Offline IndexedDB Only
 */

import { indexdbTransaksi } from '@/lib/indexdbTransaksi';
import { indexdbBarang } from '@/lib/indexdbBarang';

export interface Transaction {
  id: string;
  total: number;
  created_at: number;
  is_synced: number;
  items?: TransactionItem[];
}

export interface TransactionItem {
  id: string;
  transaction_id: string;
  product_id: string;
  qty: number;
  price_at_sale: number;
  product_name?: string;
}

export class TransactionService {
  static async create(total: number, items: { product_id: string; qty: number; price_at_sale: number }[]): Promise<string> {
    const transactionId = `TRX-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const now = new Date().toISOString();

    const transaction = {
      id: transactionId,
      total,
      items: items.map(item => ({
        product_id: item.product_id,
        product_name: '',
        qty: item.qty,
        price_at_sale: item.price_at_sale
      })),
      customerName: '',
      paymentMethod: 'cash',
      paidAmount: total,
      created_at: now,
      is_synced: true
    };

    await indexdbTransaksi.createRaw(transaction);

    // Update stock
    for (const item of items) {
      const product = await indexdbBarang.getBarang(item.product_id);
      if (product) {
        await indexdbBarang.updateBarang({
          ...product,
          stock: (product.stock || 0) - item.qty
        });
      }
    }

    return transactionId;
  }

  static async getAll(): Promise<Transaction[]> {
    const result = await indexdbTransaksi.getAll();
    return result.map((t: any) => ({
      id: t.id,
      total: t.total,
      created_at: new Date(t.created_at).getTime(),
      is_synced: t.is_synced ? 1 : 0,
      items: t.items || []
    }));
  }

  static async getById(id: string): Promise<Transaction | null> {
    const transaction = await indexdbTransaksi.getById(id);
    if (!transaction) return null;

    const items: TransactionItem[] = (transaction.items || []).map((item: any, index: number) => ({
      id: `${id}-${index}`,
      transaction_id: id,
      product_id: item.product_id || item.id || '',
      qty: item.qty || item.quantity || 1,
      price_at_sale: item.price_at_sale || item.price || 0,
      product_name: item.product_name || item.name || ''
    }));

    return {
      id: transaction.id,
      total: transaction.total || 0,
      created_at: new Date(transaction.created_at).getTime(),
      is_synced: transaction.is_synced ? 1 : 0,
      items
    };
  }
}