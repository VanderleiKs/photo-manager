import { contextBridge, ipcRenderer } from 'electron';

// Tipos para a API exposta
export interface ElectronAPI {
  // Dialog
  selectFolder: () => Promise<string | null>;

  // Library
  getCurrentLibrary: () => Promise<any>;
  createLibrary: (name: string, rootPath: string) => Promise<any>;
  scanLibrary: (libraryId: string) => Promise<any>;

  // Stats
  getStats: () => Promise<any>;

  // Photos
  getPhotos: (options: any) => Promise<any[]>;
  getPhotoById: (id: string) => Promise<any>;
  getYears: () => Promise<any[]>;
  getRecentPhotos: (limit: number) => Promise<any[]>;
  toggleFavorite: (id: string) => Promise<boolean>;

  // Thumbnails
  getThumbnail: (photoId: string) => Promise<any>;

  // Logs
  getLogs: () => Promise<any[]>;

  // Event listeners
  onScanProgress: (callback: (progress: any) => void) => void;
  onScanFile: (callback: (file: any) => void) => void;
  removeAllListeners: (channel: string) => void;
}

const api: ElectronAPI = {
  // Dialog
  selectFolder: () => ipcRenderer.invoke('dialog:selectFolder'),

  // Library
  getCurrentLibrary: () => ipcRenderer.invoke('library:getCurrent'),
  createLibrary: (name: string, rootPath: string) => ipcRenderer.invoke('library:create', name, rootPath),
  scanLibrary: (libraryId: string) => ipcRenderer.invoke('library:scan', libraryId),

  // Stats
  getStats: () => ipcRenderer.invoke('stats:get'),

  // Photos
  getPhotos: (options: any) => ipcRenderer.invoke('photos:get', options),
  getPhotoById: (id: string) => ipcRenderer.invoke('photos:getById', id),
  getYears: () => ipcRenderer.invoke('photos:getYears'),
  getRecentPhotos: (limit: number) => ipcRenderer.invoke('photos:getRecent', limit),
  toggleFavorite: (id: string) => ipcRenderer.invoke('photos:toggleFavorite', id),

  // Thumbnails
  getThumbnail: (photoId: string) => ipcRenderer.invoke('thumbnails:get', photoId),

  // Logs
  getLogs: () => ipcRenderer.invoke('logs:get'),

  // Event listeners
  onScanProgress: (callback: (progress: any) => void) => {
    ipcRenderer.on('scan:progress', (_event, progress) => callback(progress));
  },
  onScanFile: (callback: (file: any) => void) => {
    ipcRenderer.on('scan:file', (_event, file) => callback(file));
  },
  removeAllListeners: (channel: string) => {
    ipcRenderer.removeAllListeners(channel);
  }
};

contextBridge.exposeInMainWorld('electron', api);
