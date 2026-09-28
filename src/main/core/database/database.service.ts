import initSqlJs from 'sql.js';
import * as path from 'path';
import * as fs from 'fs';
import { LoggerService } from '../logging/logger.service';

// Tipo para o banco de dados sql.js
interface SqlJsDatabase {
  run(sql: string, params?: any[]): void;
  exec(sql: string, params?: any[]): Array<{ columns: string[]; values: any[][] }>;
  export(): Uint8Array;
  close(): void;
}

export interface Library {
  id: string;
  name: string;
  root_path: string;
  created_at: string;
  last_scan_at: string | null;
}

export interface Photo {
  id: string;
  library_id: string;
  relative_path: string;
  filename: string;
  file_extension: string;
  file_size: number;
  width: number | null;
  height: number | null;
  format: string;
  taken_at: string | null;
  taken_at_source: string | null;
  camera_make: string | null;
  camera_model: string | null;
  lens: string | null;
  latitude: number | null;
  longitude: number | null;
  altitude: number | null;
  duration: number | null;
  is_video: boolean;
  is_favorite: boolean;
  sha256: string | null;
  perceptual_hash: string | null;
  created_at: string;
  modified_at: string;
}

export interface YearCount {
  year: number;
  count: number;
}

export interface Stats {
  totalPhotos: number;
  totalVideos: number;
  totalFavorites: number;
  totalLibraries: number;
  years: YearCount[];
}

export class DatabaseService {
  private db: SqlJsDatabase | null = null;
  private dbPath: string;
  private isDirty = false;
  private saveInterval: NodeJS.Timeout | null = null;

  constructor(dataDir: string, private logger: LoggerService) {
    this.dbPath = path.join(dataDir, 'library.db');
  }

  async initialize(): Promise<void> {
    const dir = path.dirname(this.dbPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    const SQL = await initSqlJs({
      locateFile: (file: string) => {
        // No build empacotado, os arquivos estão em app.asar/node_modules/sql.js/dist
        // Fora do asar, estão em node_modules/sql.js/dist relativo ao projeto
        const isPackaged = __dirname.includes('app.asar');
        const basePath = isPackaged
          ? path.join(__dirname, '../../..')
          : path.join(__dirname, '../../..');
        const fullPath = path.join(basePath, 'node_modules', 'sql.js', 'dist', file);
        this.logger.debug('sql.js locateFile', { file, fullPath, isPackaged });
        return fullPath;
      }
    });

    // Carregar banco existente ou criar novo
    if (fs.existsSync(this.dbPath)) {
      const fileBuffer = fs.readFileSync(this.dbPath);
      this.db = new SQL.Database(fileBuffer);
      this.logger.info('Banco de dados carregado', { path: this.dbPath });
    } else {
      this.db = new SQL.Database();
      this.logger.info('Novo banco de dados criado', { path: this.dbPath });
    }

    this.db.run('PRAGMA journal_mode = WAL;');
    this.db.run('PRAGMA foreign_keys = ON;');

    await this.runMigrations();

    // Salvar periodicamente
    this.saveInterval = setInterval(() => this.save(), 30000);
  }

  private async runMigrations(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    // Migration 1: Tabela de bibliotecas
    this.db.run(`
      CREATE TABLE IF NOT EXISTS libraries (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        root_path TEXT NOT NULL UNIQUE,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        last_scan_at TEXT
      )
    `);

    // Migration 2: Tabela de fotos
    this.db.run(`
      CREATE TABLE IF NOT EXISTS photos (
        id TEXT PRIMARY KEY,
        library_id TEXT NOT NULL,
        relative_path TEXT NOT NULL,
        filename TEXT NOT NULL,
        file_extension TEXT NOT NULL,
        file_size INTEGER NOT NULL DEFAULT 0,
        width INTEGER,
        height INTEGER,
        format TEXT,
        taken_at TEXT,
        taken_at_source TEXT,
        camera_make TEXT,
        camera_model TEXT,
        lens TEXT,
        latitude REAL,
        longitude REAL,
        altitude REAL,
        duration REAL,
        is_video INTEGER NOT NULL DEFAULT 0,
        is_favorite INTEGER NOT NULL DEFAULT 0,
        sha256 TEXT,
        perceptual_hash TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        modified_at TEXT NOT NULL DEFAULT (datetime('now')),
        FOREIGN KEY (library_id) REFERENCES libraries(id) ON DELETE CASCADE,
        UNIQUE(library_id, relative_path)
      )
    `);

    // Migration 3: Tabela de álbuns
    this.db.run(`
      CREATE TABLE IF NOT EXISTS albums (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        is_smart INTEGER NOT NULL DEFAULT 0,
        smart_criteria TEXT,
        cover_photo_id TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now')),
        FOREIGN KEY (cover_photo_id) REFERENCES photos(id) ON DELETE SET NULL
      )
    `);

    // Migration 4: Tabela de relação fotos-álbuns
    this.db.run(`
      CREATE TABLE IF NOT EXISTS album_photos (
        album_id TEXT NOT NULL,
        photo_id TEXT NOT NULL,
        position INTEGER NOT NULL DEFAULT 0,
        added_at TEXT NOT NULL DEFAULT (datetime('now')),
        PRIMARY KEY (album_id, photo_id),
        FOREIGN KEY (album_id) REFERENCES albums(id) ON DELETE CASCADE,
        FOREIGN KEY (photo_id) REFERENCES photos(id) ON DELETE CASCADE
      )
    `);

    // Migration 5: Tabela de eventos/viagens
    this.db.run(`
      CREATE TABLE IF NOT EXISTS events (
        id TEXT PRIMARY KEY,
        library_id TEXT NOT NULL,
        name TEXT NOT NULL,
        start_date TEXT NOT NULL,
        end_date TEXT NOT NULL,
        location TEXT,
        latitude REAL,
        longitude REAL,
        photo_count INTEGER NOT NULL DEFAULT 0,
        is_confirmed INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now')),
        FOREIGN KEY (library_id) REFERENCES libraries(id) ON DELETE CASCADE
      )
    `);

    // Migration 6: Tabela de pessoas
    this.db.run(`
      CREATE TABLE IF NOT EXISTS people (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        face_count INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      )
    `);

    // Índices para performance
    this.db.run(`CREATE INDEX IF NOT EXISTS idx_photos_library ON photos(library_id);`);
    this.db.run(`CREATE INDEX IF NOT EXISTS idx_photos_taken_at ON photos(taken_at);`);
    this.db.run(`CREATE INDEX IF NOT EXISTS idx_photos_favorite ON photos(is_favorite);`);
    this.db.run(`CREATE INDEX IF NOT EXISTS idx_photos_extension ON photos(file_extension);`);
    this.db.run(`CREATE INDEX IF NOT EXISTS idx_photos_sha256 ON photos(sha256);`);
    this.db.run(`CREATE INDEX IF NOT EXISTS idx_album_photos_album ON album_photos(album_id);`);
    this.db.run(`CREATE INDEX IF NOT EXISTS idx_album_photos_photo ON album_photos(photo_id);`);

    this.save();
    this.logger.info('Migrations executadas com sucesso');
  }

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
  }

  private save(): void {
    if (!this.db || !this.isDirty) return;
    try {
      const data = this.db.export();
      fs.writeFileSync(this.dbPath, Buffer.from(data));
      this.isDirty = false;
    } catch (error: any) {
      this.logger.error('Erro ao salvar banco de dados', { error: error.message });
    }
  }

  async createLibrary(name: string, rootPath: string): Promise<Library> {
    if (!this.db) throw new Error('Database not initialized');

    const existing = this.db.exec('SELECT id FROM libraries WHERE root_path = ?', [rootPath]);
    if (existing.length > 0 && existing[0].values.length > 0) {
      const id = existing[0].values[0][0] as string;
      this.db.run('UPDATE libraries SET name = ? WHERE id = ?', [name, id]);
      this.isDirty = true;
      return this.getLibrary(id) as Promise<Library>;
    }

    const id = this.generateId();
    this.db.run('INSERT INTO libraries (id, name, root_path) VALUES (?, ?, ?)', [id, name, rootPath]);
    this.isDirty = true;

    return this.getLibrary(id) as Promise<Library>;
  }

  async getCurrentLibrary(): Promise<Library | null> {
    if (!this.db) throw new Error('Database not initialized');
    const result = this.db.exec('SELECT * FROM libraries ORDER BY created_at DESC LIMIT 1');
    if (result.length === 0 || result[0].values.length === 0) return null;
    return this.rowToLibrary(result[0].values[0]);
  }

  async getLibrary(id: string): Promise<Library | null> {
    if (!this.db) throw new Error('Database not initialized');
    const result = this.db.exec('SELECT * FROM libraries WHERE id = ?', [id]);
    if (result.length === 0 || result[0].values.length === 0) return null;
    return this.rowToLibrary(result[0].values[0]);
  }

  private rowToLibrary(row: any[]): Library {
    return {
      id: row[0] as string,
      name: row[1] as string,
      root_path: row[2] as string,
      created_at: row[3] as string,
      last_scan_at: row[4] as string | null
    };
  }

  async updateLibraryScanDate(id: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    this.db.run("UPDATE libraries SET last_scan_at = datetime('now') WHERE id = ?", [id]);
    this.isDirty = true;
  }

  async addPhoto(photo: Omit<Photo, 'id' | 'created_at' | 'modified_at'>): Promise<Photo> {
    if (!this.db) throw new Error('Database not initialized');

    const existing = this.db.exec(
      'SELECT id FROM photos WHERE library_id = ? AND relative_path = ?',
      [photo.library_id, photo.relative_path]
    );

    if (existing.length > 0 && existing[0].values.length > 0) {
      const id = existing[0].values[0][0] as string;
      this.db.run(`
        UPDATE photos SET
          file_size = ?, width = ?, height = ?, format = ?,
          taken_at = ?, taken_at_source = ?, camera_make = ?, camera_model = ?,
          lens = ?, latitude = ?, longitude = ?, altitude = ?,
          duration = ?, is_video = ?, sha256 = ?, perceptual_hash = ?,
          modified_at = datetime('now')
        WHERE id = ?
      `, [
        photo.file_size, photo.width, photo.height, photo.format,
        photo.taken_at, photo.taken_at_source, photo.camera_make, photo.camera_model,
        photo.lens, photo.latitude, photo.longitude, photo.altitude,
        photo.duration, photo.is_video ? 1 : 0, photo.sha256, photo.perceptual_hash,
        id
      ]);
      this.isDirty = true;
      return this.getPhotoById(id) as Promise<Photo>;
    }

    const id = this.generateId();
    this.db.run(`
      INSERT INTO photos (
        id, library_id, relative_path, filename, file_extension, file_size,
        width, height, format, taken_at, taken_at_source, camera_make, camera_model,
        lens, latitude, longitude, altitude, duration, is_video, is_favorite,
        sha256, perceptual_hash
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      id, photo.library_id, photo.relative_path, photo.filename, photo.file_extension, photo.file_size,
      photo.width, photo.height, photo.format, photo.taken_at, photo.taken_at_source,
      photo.camera_make, photo.camera_model, photo.lens, photo.latitude, photo.longitude,
      photo.altitude, photo.duration, photo.is_video ? 1 : 0, photo.is_favorite ? 1 : 0,
      photo.sha256, photo.perceptual_hash
    ]);
    this.isDirty = true;

    return this.getPhotoById(id) as Promise<Photo>;
  }

  async getPhotos(options: {
    libraryId?: string;
    year?: number;
    isFavorite?: boolean;
    isVideo?: boolean;
    limit?: number;
    offset?: number;
    search?: string;
  } = {}): Promise<Photo[]> {
    if (!this.db) throw new Error('Database not initialized');

    let query = 'SELECT * FROM photos WHERE 1=1';
    const params: any[] = [];

    if (options.libraryId) {
      query += ' AND library_id = ?';
      params.push(options.libraryId);
    }
    if (options.year) {
      query += " AND strftime('%Y', taken_at) = ?";
      params.push(options.year.toString());
    }
    if (options.isFavorite !== undefined) {
      query += ' AND is_favorite = ?';
      params.push(options.isFavorite ? 1 : 0);
    }
    if (options.isVideo !== undefined) {
      query += ' AND is_video = ?';
      params.push(options.isVideo ? 1 : 0);
    }
    if (options.search) {
      query += ' AND (filename LIKE ? OR camera_model LIKE ?)';
      params.push(`%${options.search}%`, `%${options.search}%`);
    }

    query += ' ORDER BY taken_at DESC';

    if (options.limit) {
      query += ' LIMIT ?';
      params.push(options.limit);
      if (options.offset) {
        query += ' OFFSET ?';
        params.push(options.offset);
      }
    }

    const result = this.db.exec(query, params);
    if (result.length === 0) return [];

    return result[0].values.map(row => this.rowToPhoto(row));
  }

  async getPhotoById(id: string): Promise<Photo | null> {
    if (!this.db) throw new Error('Database not initialized');
    const result = this.db.exec('SELECT * FROM photos WHERE id = ?', [id]);
    if (result.length === 0 || result[0].values.length === 0) return null;
    return this.rowToPhoto(result[0].values[0]);
  }

  private rowToPhoto(row: any[]): Photo {
    return {
      id: row[0] as string,
      library_id: row[1] as string,
      relative_path: row[2] as string,
      filename: row[3] as string,
      file_extension: row[4] as string,
      file_size: row[5] as number,
      width: row[6] as number | null,
      height: row[7] as number | null,
      format: row[8] as string,
      taken_at: row[9] as string | null,
      taken_at_source: row[10] as string | null,
      camera_make: row[11] as string | null,
      camera_model: row[12] as string | null,
      lens: row[13] as string | null,
      latitude: row[14] as number | null,
      longitude: row[15] as number | null,
      altitude: row[16] as number | null,
      duration: row[17] as number | null,
      is_video: (row[18] as number) === 1,
      is_favorite: (row[19] as number) === 1,
      sha256: row[20] as string | null,
      perceptual_hash: row[21] as string | null,
      created_at: row[22] as string,
      modified_at: row[23] as string
    };
  }

  async getYears(): Promise<YearCount[]> {
    if (!this.db) throw new Error('Database not initialized');
    const result = this.db.exec(`
      SELECT CAST(strftime('%Y', taken_at) AS INTEGER) as year, COUNT(*) as count
      FROM photos
      WHERE taken_at IS NOT NULL
      GROUP BY year
      ORDER BY year DESC
    `);
    if (result.length === 0) return [];
    return result[0].values.map(row => ({
      year: row[0] as number,
      count: row[1] as number
    }));
  }

  async getRecentPhotos(limit: number = 50): Promise<Photo[]> {
    if (!this.db) throw new Error('Database not initialized');
    const result = this.db.exec(`
      SELECT * FROM photos
      WHERE taken_at IS NOT NULL
      ORDER BY taken_at DESC
      LIMIT ?
    `, [limit]);
    if (result.length === 0) return [];
    return result[0].values.map(row => this.rowToPhoto(row));
  }

  async toggleFavorite(id: string): Promise<boolean> {
    if (!this.db) throw new Error('Database not initialized');
    const photo = await this.getPhotoById(id);
    if (!photo) return false;

    const newValue = photo.is_favorite ? 0 : 1;
    this.db.run('UPDATE photos SET is_favorite = ? WHERE id = ?', [newValue, id]);
    this.isDirty = true;
    return newValue === 1;
  }

  async getStats(): Promise<Stats> {
    if (!this.db) throw new Error('Database not initialized');

    const totalPhotos = this.db.exec('SELECT COUNT(*) as count FROM photos WHERE is_video = 0');
    const totalVideos = this.db.exec('SELECT COUNT(*) as count FROM photos WHERE is_video = 1');
    const totalFavorites = this.db.exec('SELECT COUNT(*) as count FROM photos WHERE is_favorite = 1');
    const totalLibraries = this.db.exec('SELECT COUNT(*) as count FROM libraries');
    const years = await this.getYears();

    return {
      totalPhotos: totalPhotos[0]?.values[0]?.[0] as number || 0,
      totalVideos: totalVideos[0]?.values[0]?.[0] as number || 0,
      totalFavorites: totalFavorites[0]?.values[0]?.[0] as number || 0,
      totalLibraries: totalLibraries[0]?.values[0]?.[0] as number || 0,
      years
    };
  }

  async removePhotosByLibrary(libraryId: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    this.db.run('DELETE FROM photos WHERE library_id = ?', [libraryId]);
    this.isDirty = true;
  }

  async close(): Promise<void> {
    if (this.saveInterval) {
      clearInterval(this.saveInterval);
      this.saveInterval = null;
    }
    this.save();
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }
}
