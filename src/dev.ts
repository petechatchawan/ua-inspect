export const IS_DEVELOPMENT =
    typeof process !== 'undefined' &&
    typeof process.env !== 'undefined' &&
    process.env.NODE_ENV !== 'production';

const warned = new Set<string>();

/** Writes one development warning per key. Production builds stay silent. */
export function warnOnce(key: string, message: string): void {
    if (!IS_DEVELOPMENT || warned.has(key)) return;
    warned.add(key);
    console.warn(message);
}
