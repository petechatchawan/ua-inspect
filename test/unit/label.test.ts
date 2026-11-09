import { label } from '../../src/labels';

describe('label', () => {
    it('returns the display name for a known id', () => {
        expect(label('browser', 'chrome')).toBe('Google Chrome');
        expect(label('os', 'android')).toBe('Android');
    });

    it('uses the fallback for a missing or unknown id', () => {
        expect(label('browser', null)).toBe('Unknown');
        expect(label('browser', undefined)).toBe('Unknown');
        expect(label('browser', 'not-a-browser')).toBe('Unknown');
    });

    it('accepts a custom fallback', () => {
        expect(label('browser', null, 'n/a')).toBe('n/a');
        expect(label('browser', 'not-a-browser', 'n/a')).toBe('n/a');
    });
});
