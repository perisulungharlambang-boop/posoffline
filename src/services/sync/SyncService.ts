/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Sync Service - No-op untuk Offline Only mode
 * Semua sinkronisasi cloud dinonaktifkan.
 */

export type TableName = 'products' | 'customers' | 'suppliers' | 'transactions' | 'restocks' | 'returs';

export interface SyncResult {
  table: TableName;
  total: number;
  successful: number;
  failed: number;
  errors: Array<{ id: string; error: string }>;
}

export interface SyncStats {
  isOnline: boolean;
  isSyncing: boolean;
  pendingItems: number;
  lastSyncTime?: number;
  results?: SyncResult[];
}

/**
 * Sync Service - Tidak melakukan sinkronisasi apapun (Offline Only)
 */
class SyncService {
  private isSyncing = false;
  private lastSyncTime: number | null = null;
  private syncListeners: Set<(stats: SyncStats) => void> = new Set();

  subscribe(callback: (stats: SyncStats) => void): () => void {
    this.syncListeners.add(callback);
    return () => this.syncListeners.delete(callback);
  }

  private async broadcastStats() {
    const stats = await this.getSyncStats();
    this.syncListeners.forEach((callback) => {
      try {
        callback(stats);
      } catch (error) {
        console.error('Error in sync listener:', error);
      }
    });
  }

  async getSyncStats(): Promise<SyncStats> {
    return {
      isOnline: false,
      isSyncing: this.isSyncing,
      pendingItems: 0,
      lastSyncTime: this.lastSyncTime || undefined,
    };
  }

  async sync(): Promise<SyncResult[]> {
    console.log('ℹ️ Sync dinonaktifkan (Offline Only mode)');
    return [];
  }

  async syncNow(): Promise<SyncResult[]> {
    return this.sync();
  }

  async syncTableOnly(table: TableName): Promise<SyncResult> {
    console.log(`ℹ️ Sync table ${table} dinonaktifkan (Offline Only mode)`);
    return { table, total: 0, successful: 0, failed: 0, errors: [] };
  }

  async pullFromSupabase(table: TableName) {
    console.log(`ℹ️ Pull ${table} dari server dinonaktifkan (Offline Only mode)`);
  }

  async clearPendingSyncs() {
    this.broadcastStats();
  }

  destroy() {
    this.syncListeners.clear();
  }
}

// Export singleton instance
export const syncService = new SyncService();