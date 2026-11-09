import { is } from '../../src/check';
import { parse } from '../../src/parse';

const info = parse('Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/150.0.0.0 Safari/537.36');

afterEach(() => {
    vi.restoreAllMocks();
});

describe('is query warnings', () => {
    it('warns once about an unknown key', () => {
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
        const query = { browsr: 'chrome' } as unknown as Parameters<typeof is>[1];

        is(info, query);
        is(info, query);

        expect(warn).toHaveBeenCalledTimes(1);
        expect(warn).toHaveBeenCalledWith(expect.stringContaining('unknown query key'));
    });

    it('warns once about a non-string parse input', () => {
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

        parse(42 as unknown as string);
        parse(42 as unknown as string);

        expect(warn).toHaveBeenCalledTimes(1);
        expect(warn).toHaveBeenCalledWith(expect.stringContaining('expected a string'));
    });

    it('does not warn about a known query', () => {
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

        is(info, { browser: 'chrome', os: 'windows' });

        expect(warn).not.toHaveBeenCalled();
    });
});
