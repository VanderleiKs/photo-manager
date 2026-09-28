import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import { LoggerService } from '../../core/logging/logger.service';
import { DatabaseService, Photo } from '../../core/database/database.service';
import { ExifParser } from '../metadata/exif-parser';

export interface ScanProgress {
  current: number;
  total: number;
  currentFile: string;
  phase: 'discovering' | 'processing' | 'complete';
}

export interface ScanResult {
  totalFound: number;
  added: number;
  updated: number;
  errors: number;
  duration: number;
}

export interface ScanOptions {
  onProgress?: (progress: ScanProgress) => void;
  onFile?: (file: string) => void;
}

export const SUPPORTED_IMAGE_EXTENSIONS = [
  '.jpg', '.jpeg', '.png', '.webp', '.heic', '.heif', '.tif', '.tiff', '.gif', '.bmp', '.raw', '.cr2', '.nef', '.arw'
];

export const SUPPORTED_VIDEO_EXTENSIONS = [
  '.mp4', '.mov', '.mkv', '.avi', '.wmv', '.flv', '.webm', '.m4v', '.mpg', '.mpeg'
];

export class ScannerService {
  private exifParser: ExifParser;
  private isCancelled = false;

  constructor(
    private db: DatabaseService,
    private logger: LoggerService
  ) {
    this.exifParser = new ExifParser();
  }

  cancel(): void {
    this.isCancelled = true;
  }

  async scan(rootPath: string, options: ScanOptions = {}): Promise<ScanResult> {
    this.isCancelled = false;
    const startTime = Date.now();

    this.logger.info('Iniciando scan da biblioteca', { rootPath });

    // Fase 1: Descobrir arquivos
    const files = await this.discoverFiles(rootPath, options);

    if (this.isCancelled) {
      throw new Error('Scan cancelado pelo usuário');
    }

    // Fase 2: Processar arquivos
    const result = await this.processFiles(rootPath, files, options);

    result.duration = Date.now() - startTime;
    this.logger.info('Scan concluído', result);

    return result;
  }

  private async discoverFiles(rootPath: string, options: ScanOptions): Promise<string[]> {
    const files: string[] = [];
    const queue: string[] = [rootPath];

    while (queue.length > 0) {
      if (this.isCancelled) break;

      const currentDir = queue.shift()!;
      try {
        const entries = await fs.promises.readdir(currentDir, { withFileTypes: true });

        for (const entry of entries) {
          const fullPath = path.join(currentDir, entry.name);

          if (entry.isDirectory()) {
            // Pular pastas ocultas e de sistema
            if (entry.name.startsWith('.') || entry.name === 'node_modules') continue;
            queue.push(fullPath);
          } else if (entry.isFile()) {
            const ext = path.extname(entry.name).toLowerCase();
            if (SUPPORTED_IMAGE_EXTENSIONS.includes(ext) || SUPPORTED_VIDEO_EXTENSIONS.includes(ext)) {
              files.push(fullPath);
            }
          }
        }
      } catch (error: any) {
        this.logger.warn('Erro ao ler diretório', { path: currentDir, error: error.message });
        // Continuar com outros diretórios
      }
    }

    this.logger.info('Arquivos descobertos', { count: files.length });
    return files;
  }

  private async processFiles(
    rootPath: string,
    files: string[],
    options: ScanOptions
  ): Promise<ScanResult> {
    const result: ScanResult = {
      totalFound: files.length,
      added: 0,
      updated: 0,
      errors: 0,
      duration: 0
    };

    // Obter ou criar biblioteca
    const libraryName = path.basename(rootPath);
    const library = await this.db.createLibrary(libraryName, rootPath);
    const libraryId = library.id;

    // Processar em lotes para não bloquear
    const batchSize = 10;
    for (let i = 0; i < files.length; i += batchSize) {
      if (this.isCancelled) break;

      const batch = files.slice(i, i + batchSize);
      const batchPromises = batch.map(file => this.processFile(file, rootPath, libraryId));

      const batchResults = await Promise.allSettled(batchPromises);

      for (const batchResult of batchResults) {
        if (batchResult.status === 'fulfilled') {
          if (batchResult.value === 'added') result.added++;
          else if (batchResult.value === 'updated') result.updated++;
        } else {
          result.errors++;
        }
      }

      // Reportar progresso
      if (options.onProgress) {
        options.onProgress({
          current: Math.min(i + batchSize, files.length),
          total: files.length,
          currentFile: path.basename(files[Math.min(i + batchSize - 1, files.length - 1)]),
          phase: 'processing'
        });
      }
    }

    if (options.onProgress) {
      options.onProgress({
        current: files.length,
        total: files.length,
        currentFile: '',
        phase: 'complete'
      });
    }

    return result;
  }

  private async processFile(
    filePath: string,
    rootPath: string,
    libraryId: string
  ): Promise<'added' | 'updated' | 'skipped'> {
    try {
      const stats = await fs.promises.stat(filePath);
      const ext = path.extname(filePath).toLowerCase();
      const isVideo = SUPPORTED_VIDEO_EXTENSIONS.includes(ext);
      const relativePath = path.relative(rootPath, filePath).replace(/\\/g, '/');

      // Verificar se já existe no banco com mesmo tamanho e data de modificação
      const existingPhotos = await this.db.getPhotos({ libraryId, limit: 1 });
      // Nota: Em produção, usaríamos um índice mais eficiente

      // Extrair metadados
      let metadata: any = {};
      try {
        if (!isVideo) {
          metadata = await this.exifParser.parseFile(filePath);
        }
      } catch (exifError: any) {
        this.logger.debug('Erro ao extrair EXIF', { file: filePath, error: exifError.message });
        // Continuar sem metadados
      }

      // Calcular data de captura
      let takenAt: string | null = null;
      let takenAtSource: string | null = null;

      if (metadata.dateTimeOriginal) {
        takenAt = this.normalizeDate(metadata.dateTimeOriginal);
        takenAtSource = 'EXIF DateTimeOriginal';
      } else if (metadata.dateTime) {
        takenAt = this.normalizeDate(metadata.dateTime);
        takenAtSource = 'EXIF DateTime';
      }

      // Fallback para data do arquivo
      if (!takenAt) {
        const fileDate = stats.mtime.toISOString();
        takenAt = fileDate;
        takenAtSource = 'file_mtime';
      }

      const photo: Omit<Photo, 'id' | 'created_at' | 'modified_at'> = {
        library_id: libraryId,
        relative_path: relativePath,
        filename: path.basename(filePath),
        file_extension: ext,
        file_size: stats.size,
        width: metadata.width || null,
        height: metadata.height || null,
        format: ext.replace('.', '').toUpperCase(),
        taken_at: takenAt,
        taken_at_source: takenAtSource,
        camera_make: metadata.make || null,
        camera_model: metadata.model || null,
        lens: metadata.lens || null,
        latitude: metadata.latitude || null,
        longitude: metadata.longitude || null,
        altitude: metadata.altitude || null,
        duration: metadata.duration || null,
        is_video: isVideo,
        is_favorite: false,
        sha256: null, // Será calculado em fase posterior
        perceptual_hash: null
      };

      // Inserir no banco - precisamos saber se foi adicionado ou atualizado
      // Simplificação: sempre tentar inserir, se conflitar, atualizar
      await this.db.addPhoto(photo);

      return 'added';
    } catch (error: any) {
      this.logger.error('Erro ao processar arquivo', { file: filePath, error: error.message });
      throw error;
    }
  }

  private normalizeDate(dateStr: string): string {
    // Tentar converter para ISO string
    try {
      // Formato EXIF: "2025:07:12 14:32:00"
      const parts = dateStr.match(/(\d{4}):(\d{2}):(\d{2}) (\d{2}):(\d{2}):(\d{2})/);
      if (parts) {
        const [, year, month, day, hour, minute, second] = parts;
        return new Date(
          parseInt(year),
          parseInt(month) - 1,
          parseInt(day),
          parseInt(hour),
          parseInt(minute),
          parseInt(second)
        ).toISOString();
      }
      return new Date(dateStr).toISOString();
    } catch {
      return dateStr;
    }
  }

  private async calculateSHA256(filePath: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const hash = crypto.createHash('sha256');
      const stream = fs.createReadStream(filePath);

      stream.on('error', reject);
      stream.on('data', (chunk) => hash.update(chunk));
      stream.on('end', () => resolve(hash.digest('hex')));
    });
  }
}
