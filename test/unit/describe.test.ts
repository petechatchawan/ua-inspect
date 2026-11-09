import { describe as describeInfo } from '../../src/labels';
import { parse } from '../../src/parse';

const chromeWindows =
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
    '(KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36';
const lineAndroid =
    'Mozilla/5.0 (Linux; Android 16; Pixel 10 Pro; wv) AppleWebKit/537.36 ' +
    '(KHTML, like Gecko) Version/4.0 Chrome/150.0.0.0 Mobile Safari/537.36 Line/26.11.0';

describe('describe', () => {
    it('summarizes a desktop browser', () => {
        expect(describeInfo(parse(chromeWindows))).toBe(
            'Google Chrome 150.0.0.0 on Windows 10 (Desktop)',
        );
    });

    it('summarizes a WebView inside a host app', () => {
        expect(describeInfo(parse(lineAndroid))).toBe(
            'Chrome Mobile 150.0.0.0 WebView on Android 16 (Mobile) in LINE',
        );
    });

    it('summarizes a listed client', () => {
        expect(
            describeInfo(
                parse('Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)'),
            ),
        ).toBe('Googlebot 2.1');
    });

    it('summarizes an unlisted bot by its token', () => {
        expect(describeInfo(parse('SomeCrawler/2.0'))).toBe('somecrawler (bot)');
    });

    it('summarizes an empty result', () => {
        expect(describeInfo(parse(''))).toBe('Unknown browser');
    });
});
