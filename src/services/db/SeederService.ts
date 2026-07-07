/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Seeder Service - Offline IndexedDB Only
 */

import { indexdbBarang } from '@/lib/indexdbBarang';

export class SeederService {
  static async count(): Promise<number> {
    return indexdbBarang.count();
  }

  static async seedAll() {
    // Data default sudah di-seed oleh indexdbBarang saat inisialisasi
    console.log('✅ Seed data sudah di-handle oleh IndexedDB');
  }
}