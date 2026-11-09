import { parse } from '../../src/parse';

const tiktokAndroid =
    'Mozilla/5.0 (Linux; Android 11; 21061119AG Build/RP1A.200720.011; wv) ' +
    'AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/92.0.4515.131 ' +
    'Mobile Safari/537.36 trill_2022109040 JsSdk/1.0 NetType/MOBILE ' +
    'Channel/googleplay AppName/musical_ly app_version/21.9.4 ByteLocale/ru-RU ' +
    'ByteFullLocale/ru-RU Region/KG BytedanceWebview/d8a21c6';

const discordDesktop =
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) ' +
    'discord/0.0.26 Chrome/108.0.5359.215 Electron/22.3.2 Safari/537.36';

describe('context metadata', () => {
    it('keeps the Chrome identity for a known TikTok WebView', () => {
        const info = parse(tiktokAndroid);

        expect(info.context.name).toBe('tiktok');
        expect(info.browser).toEqual({
            name: 'chrome-mobile',
            version: { full: '92.0.4515.131', major: 92, minor: 0, patch: 4515 },
            family: 'chromium',
            mode: 'webview',
        });
    });

    it('does not ignore the same products without a known context', () => {
        const info = parse(
            'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 ' +
                '(KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36 ' +
                'JsSdk/1.0 Channel/googleplay Region/US',
        );

        expect(info.context.name).toBeNull();
        expect(info.browser.name).toBeNull();
        expect(info.browser.family).toBe('chromium');
    });

    it('keeps Discord desktop as the Chromium host', () => {
        expect(parse(discordDesktop).browser).toEqual({
            name: 'chrome',
            version: { full: '108.0.5359.215', major: 108, minor: 0, patch: 5359 },
            family: 'chromium',
            mode: 'webview',
        });
    });

    it('does not invent a browser for a Discord app string', () => {
        const info = parse('Discord/52.0 (iPad; iOS 14.4; Scale/2.00)');

        expect(info.context.name).toBe('discord');
        expect(info.browser.name).toBeNull();
    });

    it('still drops an unknown fork beside a Chrome token', () => {
        const info = parse(
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
                '(KHTML, like Gecko) SuperFork/9.1 Chrome/150.0.0.0 Safari/537.36',
        );

        expect(info.browser.name).toBeNull();
        expect(info.browser.family).toBe('chromium');
    });
});
