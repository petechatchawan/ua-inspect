import {
    createInitialPlaygroundState,
    type PlaygroundMode,
    type PlaygroundState,
} from './playground-state';

const MAX_PERMALINK_HINTS_LENGTH = 2_000;

export interface PlaygroundPermalink {
    readonly mode: PlaygroundMode;
    readonly userAgent: string;
    readonly clientHintsText: string;
}

export function readPlaygroundPermalink(search: string): PlaygroundPermalink | null {
    const parameters = new URLSearchParams(search);
    const mode = parameters.get('mode');
    if (mode !== 'current' && mode !== 'manual') return null;

    const userAgent = parameters.get('ua') ?? '';
    const clientHintsText = parameters.get('hints') ?? '';
    if (mode === 'manual' && userAgent.trim().length === 0) return null;
    return { mode, userAgent, clientHintsText };
}

export function createPermalinkState(link: PlaygroundPermalink): PlaygroundState {
    const base = createInitialPlaygroundState();
    if (link.mode === 'current') return { ...base, mode: 'current' };

    return {
        ...base,
        mode: 'manual',
        manual: {
            ...base.manual,
            userAgent: link.userAgent,
            clientHints: {
                ...base.manual.clientHints,
                expanded: link.clientHintsText.length > 0,
                text: link.clientHintsText,
            },
            parseStatus: 'scheduled',
        },
    };
}

export function playgroundPermalink(state: PlaygroundState): string {
    const parameters = new URLSearchParams();
    parameters.set('mode', state.mode);
    if (state.mode === 'manual') {
        if (state.manual.userAgent.length > 0) parameters.set('ua', state.manual.userAgent);
        const hints = state.manual.clientHints.text;
        if (hints.length > 0 && hints.length <= MAX_PERMALINK_HINTS_LENGTH) {
            parameters.set('hints', hints);
        }
    }
    const search = parameters.toString();
    return search.length > 0 ? `?${search}` : '';
}

export function writePlaygroundPermalink(state: PlaygroundState): void {
    if (typeof history === 'undefined' || typeof location === 'undefined') return;
    const search = playgroundPermalink(state);
    history.replaceState(null, '', `${location.pathname}${search}${location.hash}`);
}
