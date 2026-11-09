import { atLeast } from '../../src/check';
import { readVersion } from '../../src/core/scan';
import { parse } from '../../src/parse';

describe('Version', () => {
    it('stringifies as the dotted version', () => {
        const version = parse(
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/150.0.6723.92 Safari/537.36',
        ).browser.version;
        if (version === null) throw new Error('expected a version');

        expect(version.toString()).toBe('150.0.6723.92');
        expect(String(version)).toBe('150.0.6723.92');
        expect(`${version}`).toBe('150.0.6723.92');
    });

    it('keeps the serialized shape unchanged', () => {
        const version = readVersion('150.0.6723.92');

        expect(JSON.parse(JSON.stringify(version))).toEqual({
            full: '150.0.6723.92',
            major: 150,
            minor: 0,
            patch: 6723,
        });
    });
});

describe('atLeast', () => {
    const version = (full: string) => {
        const parsed = readVersion(full);
        if (parsed === null) throw new Error(`Invalid test version: ${full}`);
        return parsed;
    };

    it.each([
        ['150.0.6723.92', '150', true],
        ['150.0.6723.92', '150.0.6723.92', true],
        ['150.0.6723.92', '150.0.6723.100', false],
        ['150.0.6723.92', '150.0.6000', true],
        ['150.0.6723.92', '151', false],
        ['150.0.1', '150.0', true],
        ['150', '150.0.0', true],
        ['149.9', '150', false],
    ] as const)('%s is at least %s: %s', (actual, minimum, expected) => {
        expect(atLeast(version(actual), minimum)).toBe(expected);
    });

    it('rejects a null version', () => {
        expect(atLeast(null, '150')).toBe(false);
    });

    it.each(['', 'nope', 'v150'])('rejects the malformed minimum %p', (minimum) => {
        expect(atLeast(version('150'), minimum)).toBe(false);
    });
});
