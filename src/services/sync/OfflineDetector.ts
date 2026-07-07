/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Offline Detection Service - No-op untuk Offline Only mode
 * Tidak perlu mendeteksi koneksi karena aplikasi berjalan offline saja.
 */

export type OnlineStatusCallback = (isOnline: boolean) => void;

class OfflineDetector {
  private isOnline: boolean = navigator.onLine;
  private listeners: Set<OnlineStatusCallback> = new Set();

  constructor() {
    // Setup listeners tetap berfungsi untuk informasi saja
    window.addEventListener('online', () => {
      this.isOnline = true;
      console.log('ℹ️ Device online (tapi tidak digunakan untuk sync)');
    });
    window.addEventListener('offline', () => {
      this.isOnline = false;
      console.log('ℹ️ Device offline');
    });
  }

  subscribe(callback: OnlineStatusCallback): () => void {
    this.listeners.add(callback);
    return () => {
      this.listeners.delete(callback);
    };
  }

  getStatus(): boolean {
    return this.isOnline;
  }

  destroy() {
    this.listeners.clear();
  }

  async checkNow(): Promise<boolean> {
    return navigator.onLine;
  }
}

// Export singleton instance
export const offlineDetector = new OfflineDetector();