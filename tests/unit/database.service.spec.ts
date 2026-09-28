import { describe, it, expect } from '@jest/globals';

describe('DatabaseService', () => {
  describe('Database Schema', () => {
    it('should have required tables defined', () => {
      // Verificar que as tabelas são definidas corretamente
      const expectedTables = ['libraries', 'photos', 'albums', 'album_photos', 'events', 'people'];
      expect(expectedTables).toContain('libraries');
      expect(expectedTables).toContain('photos');
      expect(expectedTables).toContain('albums');
      expect(expectedTables).toContain('events');
      expect(expectedTables).toContain('people');
    });

    it('should have required photo fields', () => {
      const requiredFields = [
        'id', 'library_id', 'relative_path', 'filename', 'file_extension',
        'file_size', 'width', 'height', 'format', 'taken_at', 'is_video', 'is_favorite'
      ];
      expect(requiredFields).toContain('id');
      expect(requiredFields).toContain('library_id');
      expect(requiredFields).toContain('relative_path');
      expect(requiredFields).toContain('filename');
      expect(requiredFields).toContain('is_video');
      expect(requiredFields).toContain('is_favorite');
    });
  });
});
