/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Supabase Client - DINONAKTIFKAN (Offline Only mode)
 * Semua layanan Supabase/PostgreSQL dinonaktifkan.
 * Aplikasi berjalan 100% offline dengan IndexedDB.
 */

// Supabase tidak digunakan (Offline Only)
export const isPostgresConfigured = false;
export const supabase = null as any;

console.log("ℹ️ [Supabase]: Layanan Supabase/PostgreSQL dinonaktifkan. Aplikasi berjalan offline-only dengan IndexedDB.");