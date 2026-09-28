import { describe, it, expect } from '@jest/globals';
import { SUPPORTED_IMAGE_EXTENSIONS, SUPPORTED_VIDEO_EXTENSIONS } from '../../src/main/ingestion/scanner/scanner.service';

describe('ScannerService', () => {
  describe('Supported Extensions', () => {
    it('should include common image formats', () => {
      expect(SUPPORTED_IMAGE_EXTENSIONS).toContain('.jpg');
      expect(SUPPORTED_IMAGE_EXTENSIONS).toContain('.jpeg');
      expect(SUPPORTED_IMAGE_EXTENSIONS).toContain('.png');
      expect(SUPPORTED_IMAGE_EXTENSIONS).toContain('.webp');
      expect(SUPPORTED_IMAGE_EXTENSIONS).toContain('.gif');
    });

    it('should include common video formats', () => {
      expect(SUPPORTED_VIDEO_EXTENSIONS).toContain('.mp4');
      expect(SUPPORTED_VIDEO_EXTENSIONS).toContain('.mov');
      expect(SUPPORTED_VIDEO_EXTENSIONS).toContain('.avi');
      expect(SUPPORTED_VIDEO_EXTENSIONS).toContain('.mkv');
    });

    it('should not include unsupported formats', () => {
      expect(SUPPORTED_IMAGE_EXTENSIONS).not.toContain('.txt');
      expect(SUPPORTED_IMAGE_EXTENSIONS).not.toContain('.pdf');
      expect(SUPPORTED_VIDEO_EXTENSIONS).not.toContain('.doc');
    });
  });
});
