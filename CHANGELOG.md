# Changelog

All notable changes to `ua-inspect` are documented in this file.

## 1.5.0 — 2026-11-09

Adds a null-safe label helper, a Thai quickstart, and compile-checked Hono and Fastify recipes.

### Added

- `label(kind, id, fallback = 'Unknown')` returns the display name for an id, or the fallback when the id is missing or unknown. It is exported from the root and from `ua-inspect/labels`.
- [docs/th-quickstart.md](docs/th-quickstart.md): a Thai quickstart covering parsing, queries, requests, the browser adapter, LINE, and the common traps.
- Compile-checked Hono and Fastify recipes under `docs/examples/frameworks`. The frameworks are dev dependencies only.

### Changed

- CI now tests Node.js 18, 20, 22, and 24, and uses `actions/checkout@v6` and `actions/setup-node@v6`.

### Notes

- Catalog Tier 2 moves to `1.6.0` because it needs real captured User-Agent strings. The package still has no runtime dependencies.

## 1.4.0 — 2026-11-09

Adds one-line result formatting and host-context helpers, and closes the remaining audit items.

### Added

- `describe(info)` returns a one-line summary for logs or UI text, such as `Google Chrome 150.0.0.0 on Windows 10 (Desktop)`. It is exported from the root and from `ua-inspect/labels`.
- `isInApp(info)` is true for an in-app browser or a mini-app and narrows `context.type`.
- `isWebView(info)` is true for `mode: 'webview'` and narrows `browser.mode`.
- The root entry exports all three helpers.

### Changed

- OS matching now runs once per parse and reuses the User-Agent candidates when Client Hints are present. Results are unchanged.
- The README documents two deliberate limits: any product ending in `bot`, `spider`, or `crawler` is an unclassified bot, and a repeated `user-agent` header joins with `, ` before parsing.

### Internal

- Added tests for `describe`, `isInApp`, `isWebView`, and the LIFF mini-app case.
- Added the new helpers to the compile-checked examples and the packed consumer fixtures.

## 1.3.0 — 2026-11-09

Resolves the browser identity for known host apps and lands the remaining small fixes from the audit.

### Added

- `isIPadOS(info)` narrows `os.name` to `'ipados'`. `isIPad` remains the broader check for the OS or the `iPad` model.
- A development warning when `parse()` receives a value that is neither a string nor `null` nor `undefined`.
- Context rows can declare metadata products to ignore. TikTok, TikTok Lite, and Discord use the new `ignores` list.

### Changed

- Known host-app metadata no longer hides the browser a WebView runs on. TikTok and TikTok Lite Android strings report `chrome-mobile` with the Chrome build, and Discord desktop reports `chrome`. The unaccounted-product guard still drops a fallback browser for unknown products, so a fork with no catalog row remains `null`.
- `detect()` on an iPad in desktop mode now reports the Safari `Version/` token as the iPadOS version instead of `null`.
- `isIPad` documentation states that it is not a type predicate. Use `isIPadOS` when `os.name` needs to be narrowed.
- `readHeader` documents that a string array joins with `, `.
- The `Version.patch` documentation states that it is the third numeric segment, not a SemVer patch number.

### Internal

- Removed the `labelOf` wrapper in device resolution.
- Shared the development warning state between `parse()` and `is()`.
- Added a test that pins the comment-group model limit for Instagram-style strings.

### Notes

- The remaining P2 items are REF-01 (resolve OS candidates once), NIT-01 (generic bot suffix), NIT-03 (array User-Agent header), and NIT-06 (optional helpers).

## 1.2.0 — 2026-11-09

Adds root convenience exports, version helpers, development query warnings, and the documentation and AI context needed to use the package without reading the whole README.

### Added

- Root exports: `is`, `isBot`, `isMobile`, `isTablet`, `isDesktop`, `isIPad`, `atLeast`, `labels`, and the `Query` type. The subpaths remain for smaller bundles.
- `atLeast(version, minimum)` compares a `Version` against a dotted minimum and returns `false` for a null version or a malformed minimum.
- `Version.toString()` returns the dotted version, so template strings and `String()` work.
- Development warnings in `is()` for unknown query keys and empty queries. Production is silent, and the return value is unchanged.
- `llms.txt`, `AGENTS.md`, `CONTRIBUTING.md`, compile-checked examples under `docs/examples`, framework recipes, and a stable-id snapshot test.
- Playground: the copied example includes the parsed Client Hints, and the mode, User-Agent, and hints are stored in the URL so a scenario can be shared.
- Bundle and package budgets in the package check.

### Changed

- The README now has a table of contents, quickstart, common mistakes, troubleshooting, a 1.0 id migration table, and framework recipes.
- `parse`, `parseRequest`, `detect`, `Version`, `is`, `atLeast`, and `labels` carry JSDoc and examples in the published declarations.
- The package check verifies that public declarations carry JSDoc and that the README links the AI context pack.
- The `Version` interface now includes `toString(): string`. A manually constructed `Version` object must add it; versions returned by the parser already have it.

### Notes

- REV-01 in the backlog, the in-app and Electron browser identity policy, remains a product decision. Detection output for those strings did not change in this release.

## 1.1.2 — 2026-11-09

Fixes the CommonJS TypeScript declarations and the silent data loss in the Client Hints merge, and validates the hint model and CPU evidence.

### Fixed

- CommonJS TypeScript consumers resolve `dist/cjs/*.d.ts` for `require`, so a `module: Node16` project no longer fails with `TS1479`. The consumer check now compiles an ESM and a CommonJS TypeScript project from the packed tarball.
- A low-entropy `Sec-CH-UA` hint no longer reduces the browser version the User-Agent reports. The hint keeps its value when it names a different major or carries more segments, so `Chrome/150.0.0.0` with `Sec-CH-UA: ...v="150"` still reports `150.0.0.0`.
- `Sec-CH-UA-Model` now passes the same validation as a User-Agent model. Placeholders such as `K`, locales such as `en-US`, metadata, and values longer than 48 characters are ignored.
- A bitness hint without an architecture hint is ignored, so a result never pairs a 64-bit architecture with 32 bits.
- `is()` no longer narrows a field that a query widened to `Query` did not name.
- `parseRequest()` treats an unreadable header value (`null`, a number, or an empty array) as missing instead of throwing a `TypeError`.
- The `labels` example in the README compiles under `strict`.
- Documented fixture counts match the corpus (27 first-party captures and 109 dimension fixtures).

### Changed

- `parseRequest()` and `detect()` keep the User-Agent version when a low-entropy hint only carries the major. Server analytics that relied on the major-only value now see the full build number the User-Agent already reported.
- A bitness-only hint no longer fills `cpu.bitness`. Use an architecture hint to report a CPU.

### Tests

- Added regressions for the CommonJS declaration path, low-entropy hints, invalid hint models, lone bitness, widened queries, malformed headers, and the documented fixture counts.
- Added a compile-checked quickstart under `docs/examples/quickstart.ts`.

## 1.1.1 — 2026-11-06

Ships the browser and in-app ids that 1.1.0 announced but did not include, and fixes the iOS 26 platform freeze.

### Fixed

- The 1.1.0 tarball was built before `android-browser`, `firefox-mobile`, `opera-mobi`, `opera-tablet`, `vivo-browser`, `twitter`, `discord` and `tiktok-lite` landed, so installing 1.1.0 gave a catalog without them. The ids, the Safari and Opera token handling, and the version fixes from the 1.1.0 notes are all present from 1.1.1.
- iOS 26 and later freeze the platform token at `18.6`. The OS version is now read from the top-level `Version/` token when the platform version is a frozen 18/19 and `Version/` reports 26 or more. Non-Safari iOS strings carry no such token and keep reporting the frozen version.

### Added

- Device predicates in `ua-inspect/check`: `isMobile`, `isTablet`, `isDesktop` and `isIPad` (`ipados` or the `iPad` model). The first three narrow `device.type`; `isIPad` only reports what the evidence names.
- `npm run check` now compares the ids the README advertises with the built catalog and fails when one is missing, so a tree that predates its own documentation cannot be packed.
- The publish workflow refuses to run unless `HEAD` carries the `v<version>` tag, so a stale branch head cannot be released.

## 1.1.0 — 2026-11-05

Splits the phone builds of Chrome, Firefox and Safari into their own browser ids, and completes the mobile, legacy and in-app rows.

This is a minor version by request, but it changes `browser.name` for phone builds. Read the breaking list before upgrading.

### Breaking

- Chrome on a phone is now `chrome-mobile`, and Safari on iOS or iPadOS is `safari-mobile`. Desktop and tablet builds keep `chrome` and `safari`.
- Firefox on Android, iOS or iPadOS is now `firefox-mobile`, not `firefox`.
- `is(info, { browser: 'chrome' })` no longer matches a phone build. Use `chrome-mobile`, or `{ family: 'chromium' }` for any Chromium product.
- Chrome on Android or HarmonyOS WebView now reports `chrome-mobile` with `mode: 'webview'`, including LINE, Facebook and Instagram in-app browsers.
- An iOS in-app browser with a `Safari/` token now reports `safari-mobile` instead of a `null` browser name.

### Added

- Browser ids `chrome-mobile`, `safari-mobile`, `firefox-mobile`, `opera-mobi`, `opera-tablet` and `vivo-browser`, with display names in `labels`.
- In-app contexts `tiktok-lite` (`AppName/ultralite`), `twitter` (`TwitterAndroid` and `Twitter for iPhone/`) and `discord` (`discord/` and `Discord/`).
- A form-factor build is a fallback: a specific product such as Samsung Internet, Edge or Brave still wins, and the desktop and tablet builds are unchanged.
- `detect()` reads `platform` and `maxTouchPoints` to report an iPad in desktop mode as `ipados`, `tablet`, `apple` and `iPad`. `parse()` and `parseRequest()` cannot see this, because the User-Agent says Macintosh.
- Browser id `android-browser` for the stock Android browser, the only client that sends a `Version/` token on Android with no Chrome token. Android 4.4 rebuilt it on Chromium, so those builds stay `chrome-mobile`.
- Chrome, Chrome Mobile and Chromium before version 28 report the `webkit` engine, since version 28 is the first Blink release. Other chromium-family rows keep `blink`.
- The early Chrome for Android `CrMo/` token reports `chrome-mobile`, and `HeadlessChrome` with no version still reports `chrome` with `mode: 'headless'`.
- An Android version written with a dash (`Android-4.0.3`, the form the 2012 phone strings use) reads as `android`.
- Opera before version 15 reports the `presto` engine and no browser family, and reads its release from `Version/` when the string has it. `OPRGX/` names Opera GX, `EdgW/` reports Edge with `mode: 'webview'`, and `HBPC/` names Huawei Browser on Windows.
- Safari on Windows is detected, and a Safari build that predates `Version/` reports no release instead of its WebKit build number.
- A version with a comma (`Version/15.6,2`) reads as `15.6.2`.
- `PPC Mac OS X` reports macOS with no version.
- TikTok reads `trill_*` and prefers `app_version/` over the build code.
- Tokens that a catalog row already names are accounted for, so an in-app token no longer hides the underlying Chrome or Safari build.
- Stored User-Agent strings for 45 browser rows and 13 in-app context rows live in `test/data/<dimension>/`.

## 1.0.1 — 2026-11-05

Expands the catalog and tightens detection. Test data is now first-party only: every vector is a real captured string.

### Added

- Browsers: `360`, `coc-coc`, `duckduckgo`, `ecosia`, `edge-legacy`, `ie`, `opera-gx`, `opera-mini`, `pale-moon`, `puffin`, `qq`, `whale`.
- Operating systems: `blackberry`, `firefox-os`, `fuchsia`, `openharmony`, `steamos`, `symbian`, `tvos`, `watchos`, `webos`, `windows-phone`.
- Device vendors: `asus`, `honor`, `infinix`, `itel`, `lg`, `nokia`, `nothing`, `tecno`, `zte`.
- Rendering engines: `edgehtml` and `presto`.
- In-app context: `tiktok`.
- Samsung model prefix `SCG`.

### Fixed

- `EdgWebView2` is reported as `mode: 'webview'`.
- Internet Explorer reports a `null` engine instead of `trident`.
- Edge Legacy is `edge-legacy` with the `edgehtml` engine; `Edg/` stays modern `edge`.
- Opera Mini beats Opera, and the iOS `OPiOS` token is `webkit`.
- QQ Browser is no longer swallowed by `MicroMessenger`.
- TikTok prefers the explicit `app_version` token over the `musical_ly_<build>` build code.
- Version-like tokens such as `312.0.0.34.111` are not treated as product names.
- `touch` is not a device model, and `iphone*` models parse as `iPhone`.
- Device mapping: Steam Deck is `console`, `appletv*` is `smart-tv`, `watchos*` is `wearable`, and `windows` with `windows-phone` is `mobile`.
- BlackBerry and Firefox OS `Mobile` tokens report `mobile`.

### Changed

- Tests moved from `src/__tests__/` to `test/unit/`, and capture data to `test/data/`.
- `scripts/` grouped by purpose: `build/`, `verify/`, `playground/`, `performance/`.
- Development TypeScript updated to 5.x.
- Removed all third-party test vectors and notices; the corpus held real captures only.

## 1.0.0 — 2026-11-04

First release. Zero-dependency User-Agent parser for TypeScript, in Node.js and browsers.

### Features

- `parse()` reads a User-Agent string. `parseRequest()` adds Client Hints from request headers. `detect()` reads the current browser.
- Dimensions: browser, rendering engine, operating system, device, CPU, non-browser client, and execution context.
- Bot, WebView, in-app (LINE, LIFF, Facebook, Instagram, Messenger, WeChat), and PWA detection.
- `ua-inspect/check` exposes `is()` with compile-time narrowing and `isBot()`.
- `ua-inspect/labels` maps ids to display text.
- ESM, CommonJS, and TypeScript declarations. Node.js 18 or newer.
