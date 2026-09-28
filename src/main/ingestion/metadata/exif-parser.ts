import * as fs from 'fs';
import * as path from 'path';

export interface ExifData {
  dateTimeOriginal?: string;
  dateTime?: string;
  make?: string;
  model?: string;
  lens?: string;
  width?: number;
  height?: number;
  latitude?: number;
  longitude?: number;
  altitude?: number;
  duration?: number;
  iso?: number;
  aperture?: number;
  shutterSpeed?: number;
  focalLength?: number;
  orientation?: number;
}

export class ExifParser {
  async parseFile(filePath: string): Promise<ExifData> {
    const ext = path.extname(filePath).toLowerCase();

    // Para vídeos, tentar extrair metadados básicos
    if (['.mp4', '.mov', '.mkv', '.avi'].includes(ext)) {
      return this.parseVideoMetadata(filePath);
    }

    // Para imagens, tentar ler EXIF
    return this.parseImageMetadata(filePath);
  }

  private async parseImageMetadata(filePath: string): Promise<ExifData> {
    try {
      const buffer = await this.readFileBuffer(filePath);
      return this.extractExifFromBuffer(buffer, filePath);
    } catch {
      return {};
    }
  }

  private async parseVideoMetadata(filePath: string): Promise<ExifData> {
    try {
      const buffer = await this.readFileBuffer(filePath);
      return this.extractVideoMetadata(buffer, filePath);
    } catch {
      return {};
    }
  }

  private async readFileBuffer(filePath: string): Promise<Buffer> {
    const stats = await fs.promises.stat(filePath);
    const fd = await fs.promises.open(filePath, 'r');
    const buffer = Buffer.alloc(Math.min(stats.size, 1024 * 1024)); // Ler no máximo 1MB
    await fd.read(buffer, 0, buffer.length, 0);
    await fd.close();
    return buffer;
  }

  private extractExifFromBuffer(buffer: Buffer, filePath: string): ExifData {
    const result: ExifData = {};

    // Tentar encontrar strings EXIF comuns no buffer
    const text = buffer.toString('latin1');

    // Procurar por padrões comuns de metadados
    // Make
    const makeMatch = text.match(/Make\x00+([^\x00]+)/);
    if (makeMatch) result.make = makeMatch[1].trim();

    // Model
    const modelMatch = text.match(/Model\x00+([^\x00]+)/);
    if (modelMatch) result.model = modelMatch[1].trim();

    // DateTimeOriginal
    const dtoMatch = text.match(/DateTimeOriginal\x00+([^\x00]+)/);
    if (dtoMatch) result.dateTimeOriginal = dtoMatch[1].trim();

    // DateTime
    const dtMatch = text.match(/DateTime\x00+([^\x00]+)/);
    if (dtMatch) result.dateTime = dtMatch[1].trim();

    // Lens
    const lensMatch = text.match(/LensModel\x00+([^\x00]+)/);
    if (lensMatch) result.lens = lensMatch[1].trim();

    // Dimensões - tentar extrair do JPEG
    const ext = path.extname(filePath).toLowerCase();
    if (['.jpg', '.jpeg'].includes(ext)) {
      const dimensions = this.extractJpegDimensions(buffer);
      if (dimensions) {
        result.width = dimensions.width;
        result.height = dimensions.height;
      }
    }

    // GPS
    const gpsMatch = text.match(/GPSLatitude\x00+([^\x00]+)/);
    if (gpsMatch) {
      result.latitude = this.parseGpsCoordinate(gpsMatch[1]);
    }

    const gpsLonMatch = text.match(/GPSLongitude\x00+([^\x00]+)/);
    if (gpsLonMatch) {
      result.longitude = this.parseGpsCoordinate(gpsLonMatch[1]);
    }

    return result;
  }

  private extractVideoMetadata(buffer: Buffer, filePath: string): ExifData {
    const result: ExifData = {};
    const text = buffer.toString('latin1');

    // Tentar encontrar duração em vídeos MP4/MOV
    const durationMatch = text.match(/duration\x00+([^\x00]+)/);
    if (durationMatch) {
      const duration = parseFloat(durationMatch[1]);
      if (!isNaN(duration)) {
        result.duration = duration;
      }
    }

    // Tentar encontrar data de criação
    const creationMatch = text.match(/creationTime\x00+([^\x00]+)/);
    if (creationMatch) {
      result.dateTime = creationMatch[1].trim();
    }

    return result;
  }

  private extractJpegDimensions(buffer: Buffer): { width: number; height: number } | null {
    // Procurar por marcadores JPEG
    for (let i = 0; i < buffer.length - 4; i++) {
      // SOF0, SOF1, SOF2 markers
      if (buffer[i] === 0xFF && (buffer[i + 1] === 0xC0 || buffer[i + 1] === 0xC1 || buffer[i + 1] === 0xC2)) {
        const height = buffer.readUInt16BE(i + 5);
        const width = buffer.readUInt16BE(i + 7);
        if (width > 0 && height > 0) {
          return { width, height };
        }
      }
    }
    return null;
  }

  private parseGpsCoordinate(coord: string): number {
    // Simplificação - em produção usar parser completo
    const match = coord.match(/(\d+\.?\d*)/);
    return match ? parseFloat(match[1]) : 0;
  }
}
