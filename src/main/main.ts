import { app, BrowserWindow, ipcMain, dialog, shell } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import { DatabaseService } from './core/database/database.service';
import { ScannerService } from './ingestion/scanner/scanner.service';
import { ThumbnailService } from './core/thumbnails/thumbnail.service';
import { LoggerService } from './core/logging/logger.service';

// Log de emergência para debug
const emergencyLog = path.join(process.env['APPDATA'] || process.env['HOME'] || '.', 'photomanager-emergency.log');
function logEmergency(message: string): void {
  try {
    fs.appendFileSync(emergencyLog, `[${new Date().toISOString()}] ${message}\n`);
  } catch {
    // Ignorar erros
  }
}

process.on('uncaughtException', (error) => {
  logEmergency(`UNCAUGHT EXCEPTION: ${error.message}\n${error.stack}`);
  dialog.showErrorBox('Erro Fatal', `Erro não capturado: ${error.message}`);
  app.quit();
});

process.on('unhandledRejection', (reason: any) => {
  logEmergency(`UNHANDLED REJECTION: ${reason?.message || reason}`);
  dialog.showErrorBox('Erro Fatal', `Promise rejeitada: ${reason?.message || reason}`);
  app.quit();
});

logEmergency('App iniciando...');

let mainWindow: BrowserWindow | null = null;
let dbService: DatabaseService;
let scannerService: ScannerService;
let thumbnailService: ThumbnailService;
let logger: LoggerService;

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1024,
    minHeight: 700,
    webPreferences: {
      preload: path.join(__dirname, '../preload/preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    },
    // icon: path.join(__dirname, '../../assets/icon.ico'), // TODO: adicionar icon.ico
    title: 'PhotoManager'
  });

  // Em development, carrega do dev server
  if (process.env['NODE_ENV'] === 'development') {
    mainWindow.loadURL('http://localhost:4200');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../renderer/browser/index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url);
    return { action: 'deny' };
  });
}

async function initializeServices(): Promise<void> {
  logger = new LoggerService();
  logger.info('Inicializando serviços...');

  const dataDir = path.join(app.getPath('userData'), 'data');
  const thumbnailDir = path.join(app.getPath('userData'), 'thumbnails');

  dbService = new DatabaseService(dataDir, logger);
  await dbService.initialize();

  scannerService = new ScannerService(dbService, logger);
  thumbnailService = new ThumbnailService(thumbnailDir, logger);

  logger.info('Serviços inicializados com sucesso');
}

function setupIpcHandlers(): void {
  // Selecionar pasta da biblioteca
  ipcMain.handle('dialog:selectFolder', async () => {
    if (!mainWindow) {
      throw new Error('Janela principal não disponível');
    }
    const result = await dialog.showOpenDialog(mainWindow, {
      properties: ['openDirectory']
    });
    return result.canceled ? null : result.filePaths[0];
  });

  // Obter biblioteca atual
  ipcMain.handle('library:getCurrent', async () => {
    return dbService.getCurrentLibrary();
  });

  // Criar/atualizar biblioteca
  ipcMain.handle('library:create', async (_event, name: string, rootPath: string) => {
    return dbService.createLibrary(name, rootPath);
  });

  // Escanear biblioteca
  ipcMain.handle('library:scan', async (_event, libraryId: string) => {
    const library = await dbService.getLibrary(libraryId);
    if (!library) {
      throw new Error('Biblioteca não encontrada');
    }

    const result = await scannerService.scan(library.root_path, {
      onProgress: (progress) => {
        mainWindow?.webContents.send('scan:progress', progress);
      },
      onFile: (file) => {
        mainWindow?.webContents.send('scan:file', file);
      }
    });

    await dbService.updateLibraryScanDate(libraryId);
    return result;
  });

  // Obter estatísticas
  ipcMain.handle('stats:get', async () => {
    return dbService.getStats();
  });

  // Obter fotos
  ipcMain.handle('photos:get', async (_event, options: any) => {
    return dbService.getPhotos(options);
  });

  // Obter foto por ID
  ipcMain.handle('photos:getById', async (_event, id: string) => {
    return dbService.getPhotoById(id);
  });

  // Obter anos com contagem
  ipcMain.handle('photos:getYears', async () => {
    return dbService.getYears();
  });

  // Obter fotos recentes
  ipcMain.handle('photos:getRecent', async (_event, limit: number = 50) => {
    return dbService.getRecentPhotos(limit);
  });

  // Alternar favorito
  ipcMain.handle('photos:toggleFavorite', async (_event, id: string) => {
    return dbService.toggleFavorite(id);
  });

  // Obter thumbnail
  ipcMain.handle('thumbnails:get', async (_event, photoId: string) => {
    const photo = await dbService.getPhotoById(photoId);
    if (!photo) return null;
    return thumbnailService.getOrCreate(photo);
  });

  // Logs
  ipcMain.handle('logs:get', async () => {
    return logger.getLogs();
  });
}

app.whenReady().then(async () => {
  try {
    logEmergency('App ready, inicializando serviços...');
    await initializeServices();
    logEmergency('Serviços inicializados, criando janela...');
    createWindow();
    setupIpcHandlers();
    logEmergency('Janela criada com sucesso');
  } catch (error: any) {
    const msg = `Erro ao inicializar aplicação: ${error?.message || error}\n${error?.stack || ''}`;
    logEmergency(msg);
    console.error(msg);
    dialog.showErrorBox('Erro Fatal', msg);
    app.quit();
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
