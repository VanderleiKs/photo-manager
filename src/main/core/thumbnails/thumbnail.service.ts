import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import { LoggerService } from '../logging/logger.service';
import { Photo } from '../database/database.service';

export interface ThumbnailResult {
  photoId: string;
  thumbnailPath: string;
  width: number;
  height: number;
}

export class ThumbnailService {
  private thumbnailDir: string;
  private sizes = [256, 512, 1024];

  constructor(baseDir: string, private logger: LoggerService) {
    this.thumbnailDir = baseDir;
    this.ensureDirectories();
  }

  private ensureDirectories(): void {
    if (!fs.existsSync(this.thumbnailDir)) {
      fs.mkdirSync(this.thumbnailDir, { recursive: true });
    }
    for (const size of this.sizes) {
      const dir = path.join(this.thumbnailDir, size.toString());
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    }
  }

  async getOrCreate(photo: Photo): Promise<ThumbnailResult | null> {
    try {
      // Verificar se já existe thumbnail
      const existingPath = this.getThumbnailPath(photo.id, 512);
      if (fs.existsSync(existingPath)) {
        return {
          photoId: photo.id,
          thumbnailPath: existingPath,
          width: 512,
          height: 512
        };
      }

      // Gerar thumbnail
      return await this.generateThumbnail(photo);
    } catch (error: any) {
      this.logger.warn('Erro ao gerar thumbnail', { photoId: photo.id, error: error.message });
      return null;
    }
  }

  private async generateThumbnail(photo: Photo): Promise<ThumbnailResult | null> {
    // Em produção, usar sharp para gerar thumbnails
    // Por enquanto, retornar placeholder
    this.logger.debug('Gerando thumbnail', { photoId: photo.id });

    // Criar arquivo placeholder
    const thumbnailPath = this.getThumbnailPath(photo.id, 512);
    const placeholderContent = this.createPlaceholderImage(photo.filename);
    await fs.promises.writeFile(thumbnailPath, placeholderContent);

    return {
      photoId: photo.id,
      thumbnailPath,
      width: 512,
      height: 512
    };
  }

  private getThumbnailPath(photoId: string, size: number): string {
    return path.join(this.thumbnailDir, size.toString(), `${photoId}.webp`);
  }

  private createPlaceholderImage(filename: string): Buffer {
    // Criar uma imagem SVG placeholder simples
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
      <rect width="512" height="512" fill="#e0e0e0"/>
      <text x="50%" y="50%" font-family="Arial" font-size="24" fill="#999" text-anchor="middle" dy=".3em">${filename}</text>
    </svg>`;
    return Buffer.from(svg);
  }

  async deleteThumbnails(photoId: string): Promise<void> {
    for (const size of this.sizes) {
      const thumbnailPath = this.getThumbnailPath(photoId, size);
      try {
        if (fs.existsSync(thumbnailPath)) {
          await fs.promises.unlink(thumbnailPath);
        }
      } catch (error: any) {
        this.logger.warn('Erro ao deletar thumbnail', { photoId, size, error: error.message });
      }
    }
  }

  async cleanup(photoIds: string[]): Promise<void> {
    // Remover thumbnails de fotos que não existem mais
    const validIds = new Set(photoIds);

    for (const size of this.sizes) {
      const sizeDir = path.join(this.thumbnailDir, size.toString());
      if (!fs.existsSync(sizeDir)) continue;

      const files = await fs.promises.readdir(sizeDir);
      for (const file of files) {
        const photoId = path.basename(file, '.webp');
        if (!validIds.has(photoId)) {
          try {
            await fs.promises.unlink(path.join(sizeDir, file));
          } catch (error: any) {
            this.logger.warn('Erro ao limpar thumbnail', { file, error: error.message });
          }
        }
      }
    }
  }
}
