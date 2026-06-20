import { describe, it, expect } from 'vitest';
import app from '../../app.js';

describe('Color Helpers', () => {
  describe('normalizeHex', () => {
    it('should expand 3-digit hex codes to 6-digit ones', () => {
      expect(app.normalizeHex('#fff')).toBe('#ffffff');
      expect(app.normalizeHex('#123')).toBe('#112233');
    });

    it('should leave 6-digit hex codes unchanged', () => {
      expect(app.normalizeHex('#aabbcc')).toBe('#aabbcc');
      expect(app.normalizeHex('#123456')).toBe('#123456');
    });
  });

  describe('interpolateColor', () => {
    it('should return color1 when factor is 0', () => {
      const color1 = '#0f201b';
      const color2 = '#1a160f';
      expect(app.interpolateColor(color1, color2, 0)).toBe('#0f201b');
    });

    it('should return color2 when factor is 1', () => {
      const color1 = '#0f201b';
      const color2 = '#1a160f';
      expect(app.interpolateColor(color1, color2, 1)).toBe('#1a160f');
    });

    it('should return midpoint color when factor is 0.5', () => {
      // #000000 and #ffffff mid is #808080
      const mid = app.interpolateColor('#000000', '#ffffff', 0.5);
      expect(mid.toLowerCase()).toBe('#808080');
    });
  });
});
