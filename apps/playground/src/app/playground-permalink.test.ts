import { describe, expect, it } from 'vitest';
import {
    createPermalinkState,
    playgroundPermalink,
    readPlaygroundPermalink,
} from './playground-permalink';
import { createInitialPlaygroundState } from './playground-state';

describe('playground permalink', () => {
    it('round-trips manual input', () => {
        const base = createInitialPlaygroundState();
        const hints = '{\n  "sec-ch-ua": "\\"Google Chrome\\";v=\\"130\\""\n}';
        const state = {
            ...base,
            mode: 'manual' as const,
            manual: {
                ...base.manual,
                userAgent: 'Mozilla/5.0',
                clientHints: { ...base.manual.clientHints, text: hints },
            },
        };

        const link = readPlaygroundPermalink(playgroundPermalink(state));

        expect(link).toEqual({ mode: 'manual', userAgent: 'Mozilla/5.0', clientHintsText: hints });
        const restored = createPermalinkState(link as NonNullable<typeof link>);
        expect(restored.mode).toBe('manual');
        expect(restored.manual.userAgent).toBe('Mozilla/5.0');
        expect(restored.manual.clientHints.text).toBe(hints);
        expect(restored.manual.clientHints.expanded).toBe(true);
    });

    it('round-trips the current mode', () => {
        const state = createInitialPlaygroundState();
        expect(playgroundPermalink(state)).toBe('?mode=current');
        expect(readPlaygroundPermalink(playgroundPermalink(state))).toEqual({
            mode: 'current',
            userAgent: '',
            clientHintsText: '',
        });
    });

    it('ignores an unknown mode and a manual link without a User-Agent', () => {
        expect(readPlaygroundPermalink('')).toBeNull();
        expect(readPlaygroundPermalink('?mode=other')).toBeNull();
        expect(readPlaygroundPermalink('?mode=manual')).toBeNull();
    });

    it('omits Client Hints that would make the URL too long', () => {
        const base = createInitialPlaygroundState();
        const state = {
            ...base,
            mode: 'manual' as const,
            manual: {
                ...base.manual,
                userAgent: 'Mozilla/5.0',
                clientHints: { ...base.manual.clientHints, text: 'x'.repeat(2_001) },
            },
        };

        expect(playgroundPermalink(state)).not.toContain('hints=');
    });
});
