/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Firebase Client - DINONAKTIFKAN (Offline Only mode)
 * Semua layanan Firebase/Firestore dinonaktifkan.
 * Aplikasi berjalan 100% offline dengan IndexedDB.
 */

// Semua Firebase dinonaktifkan
export const isFirebaseConfigured = false;
export const app = null as any;
export const db = null as any;
export const auth = null as any;

console.log("ℹ️ [Firebase]: Layanan Firebase/Firestore dinonaktifkan. Aplikasi berjalan offline-only dengan IndexedDB.");

// Operation types untuk backward compatibility (tidak digunakan)
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

// No-op handler
export function handleFirestoreError(_error: unknown, _operationType: OperationType, _path: string | null) {
  console.warn('⚠️ Firestore dinonaktifkan, tidak ada error handling yang diperlukan.');
}