/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Product Service - Offline IndexedDB Only
 */

import { indexdbBarang } from '@/lib/indexdbBarang';

export const ProductService = {
  async getAll(): Promise<any[]> {
    return indexdbBarang.getAllBarang();
  },

  async getPaged(offset: number, limit: number = 100): Promise<any[]> {
    return indexdbBarang.getPaged(offset, limit);
  },

  async getCount(): Promise<number> {
    return indexdbBarang.count();
  },

  async search(query: string): Promise<any[]> {
    return indexdbBarang.search(query);
  },

  async upsert(product: any) {
    return indexdbBarang.updateBarang(product);
  },

  async delete(id: string) {
    return indexdbBarang.deleteBarang(id);
  }
};