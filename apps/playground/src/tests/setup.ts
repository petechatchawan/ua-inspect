import { afterEach } from 'vitest';

afterEach(() => {
    document.body.replaceChildren();
    window.history.replaceState(null, '', '/');
});
