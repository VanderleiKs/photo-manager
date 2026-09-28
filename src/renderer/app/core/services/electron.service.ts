import { Injectable } from '@angular/core';

// Tipos para a API do Electron exposta via preload
interface ElectronAPI {
  selectFolder: () => Promise<string | null>;
  getCurrentLibrary: () => Promise<any>;
  createLibrary: (name: string, rootPath: string) => Promise<any>;
  scanLibrary: (libraryId: string) => Promise<any>;
  getStats: () => Promise<any>;
  getPhotos: (options: any) => Promise<any[]>;
  getPhotoById: (id: string) => Promise<any>;
  getYears: () => Promise<any[]>;
  getRecentPhotos: (limit: number) => Promise<any[]>;
  toggleFavorite: (id: string) => Promise<boolean>;
  getThumbnail: (photoId: string) => Promise<any>;
  getLogs: () => Promise<any[]>;
  onScanProgress: (callback: (progress: any) => void) => void;
  onScanFile: (callback: (file: any) => void) => void;
  removeAllListeners: (channel: string) => void;
}

declare global {
  interface Window {
    electron: ElectronAPI;
  }
}

@Injectable({
  providedIn: 'root'
})
export class ElectronService {
  private get api(): ElectronAPI | null {
    return window.electron || null;
  }

  get isElectron(): boolean {
    return !!this.api;
  }

  // Dialog
  async selectFolder(): Promise<string | null> {
    if (!this.api) return null;
    return this.api.selectFolder();
  }

  // Library
  async getCurrentLibrary(): Promise<any> {
    if (!this.api) return null;
    return this.api.getCurrentLibrary();
  }

  async createLibrary(name: string, rootPath: string): Promise<any> {
    if (!this.api) throw new Error('Electron API não disponível');
    return this.api.createLibrary(name, rootPath);
  }

  async scanLibrary(libraryId: string): Promise<any> {
    if (!this.api) throw new Error('Electron API não disponível');
    return this.api.scanLibrary(libraryId);
  }

  // Stats
  async getStats(): Promise<any> {
    if (!this.api) return null;
    return this.api.getStats();
  }

  // Photos
  async getPhotos(options: any = {}): Promise<any[]> {
    if (!this.api) return [];
    return this.api.getPhotos(options);
  }

  async getPhotoById(id: string): Promise<any> {
    if (!this.api) return null;
    return this.api.getPhotoById(id);
  }

  async getYears(): Promise<any[]> {
    if (!this.api) return [];
    return this.api.getYears();
  }

  async getRecentPhotos(limit: number = 50): Promise<any[]> {
    if (!this.api) return [];
    return this.api.getRecentPhotos(limit);
  }

  async toggleFavorite(id: string): Promise<boolean> {
    if (!this.api) return false;
    return this.api.toggleFavorite(id);
  }

  // Thumbnails
  async getThumbnail(photoId: string): Promise<any> {
    if (!this.api) return null;
    return this.api.getThumbnail(photoId);
  }

  // Logs
  async getLogs(): Promise<any[]> {
    if (!this.api) return [];
    return this.api.getLogs();
  }

  // Event listeners
  onScanProgress(callback: (progress: any) => void): void {
    if (this.api) {
      this.api.onScanProgress(callback);
    }
  }

  onScanFile(callback: (file: any) => void): void {
    if (this.api) {
      this.api.onScanFile(callback);
    }
  }

  removeAllListeners(channel: string): void {
    if (this.api) {
      this.api.removeAllListeners(channel);
    }
  }
}
