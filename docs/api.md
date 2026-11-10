# API reference

The public API of `ua-inspect` 1.5 and later. For a task-oriented guide, read the [README](../README.md). For a one-page AI summary, read [llms.txt](../llms.txt).

## Entry points

| Import               | Exports                                                                                                                                                                   |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ua-inspect`         | `parse`, `is`, `atLeast`, `isBot`, `isMobile`, `isTablet`, `isDesktop`, `isIPad`, `isIPadOS`, `isInApp`, `isWebView`, `describe`, `label`, `labels`, and the result types |
| `ua-inspect/check`   | `is`, `atLeast`, and the predicates, without `labels`                                                                                                                     |
| `ua-inspect/server`  | `parseRequest`, `readHeader`, and the header types                                                                                                                        |
| `ua-inspect/browser` | `detect`, `DetectOptions`, and `LiffAdapter`                                                                                                                              |
| `ua-inspect/labels`  | `labels`, `label`, `describe`, and `LabelKind`                                                                                                                            |

## Result

Every adapter returns the same shape:

```ts
interface UAInfo {
    ua: string;
    browser: BrowserInfo;
    engine: EngineInfo;
    os: OSInfo;
    device: DeviceInfo;
    cpu: CPUInfo;
    client: ClientInfo;
    context: ContextInfo;
}
```

A field is `null` when the evidence does not name it. There is no `"unknown"` sentinel.

```ts
interface Version {
    full: string;
    major: number;
    minor: number | null;
    patch: number | null;
    toString(): string; // returns `full`
}
```

`patch` is the third numeric segment, not a SemVer patch number. `String(version)` and template strings return the dotted version.

## Parsing

### `parse(userAgent)`

```ts
function parse(userAgent: string | null | undefined): UAInfo;
```

Parses a User-Agent string. It is synchronous and never throws. Detection reads at most the first 1,024 characters, while `info.ua` keeps the full input. A non-string value in Node.js development, when `process.env.NODE_ENV` is not `production`, produces one warning and is treated as an empty string.

### `parseRequest(input)`

```ts
type HeaderValue = string | readonly string[] | undefined;
type HeaderRecord = Readonly<Record<string, HeaderValue>>;
type HeaderSource = HeaderRecord | { get(name: string): string | null };
type ParseRequestInput = HeaderSource | { headers: HeaderSource; userAgent?: string };

function parseRequest(input: ParseRequestInput): UAInfo;
```

Reads the User-Agent and the `Sec-CH-UA-*` headers that are present. It accepts a `Request`, a `Headers` object, or a plain header record. It does not emit `Accept-CH` or manage caching. Header values that are not strings or string arrays are treated as missing. An array joins with `, `.

### `detect(options?)`

```ts
interface LiffAdapter {
    isInClient(): boolean;
}

interface DetectOptions {
    highEntropy?: boolean;
    liff?: LiffAdapter;
}

function detect(options?: DetectOptions): Promise<UAInfo>;
```

Reads the current browser from `navigator.userAgent`, the low-entropy Client Hints, and the runtime touch signals that recover an iPad in desktop mode.

`highEntropy: true` requests exactly `architecture`, `bitness`, `fullVersionList`, `model`, and `platformVersion`. It throws outside a browser window or worker. Node.js 21 and later define `navigator` but not `document`, so it still throws on the server.

## Queries

### `is(info, query)`

```ts
function is<Q extends Query>(info: UAInfo, query: Q): info is UAInfo & Narrowed<Q>;
```

Keys combine with AND. The values of one key combine with OR. An unknown id never matches. At runtime, an unknown query key is ignored and warns in Node.js development. A query widened to `Query` does not narrow fields that it does not name.

| Key           | Values                                                     |
| ------------- | ---------------------------------------------------------- |
| `browser`     | `BrowserId`                                                |
| `family`      | `'chromium' \| 'firefox' \| 'safari'`                      |
| `mode`        | `'browser' \| 'webview' \| 'headless'`                     |
| `engine`      | `'blink' \| 'edgehtml' \| 'gecko' \| 'presto' \| 'webkit'` |
| `os`          | `OSId`                                                     |
| `device`      | `DeviceType`                                               |
| `vendor`      | `VendorId`                                                 |
| `client`      | `ClientId`                                                 |
| `clientType`  | `ClientType`                                               |
| `context`     | `ContextId`                                                |
| `contextType` | `ContextType`                                              |
| `app`         | `AppId`                                                    |

In Node.js development, `is()` warns once for an unknown key and once for an empty query. The return value does not change, and production is silent.

### `atLeast(version, minimum)`

```ts
function atLeast(version: Version | null, minimum: string): boolean;
```

Compares segment by segment. Missing segments count as zero. A null version or a malformed minimum returns `false`.

## Predicates

| Function          | True when                                          | Narrows        |
| ----------------- | -------------------------------------------------- | -------------- |
| `isBot(info)`     | `client.type` is `bot`, `crawler`, or `ai-crawler` | no             |
| `isMobile(info)`  | `device.type` is `mobile`                          | `device.type`  |
| `isTablet(info)`  | `device.type` is `tablet`                          | `device.type`  |
| `isDesktop(info)` | `device.type` is `desktop`                         | `device.type`  |
| `isIPad(info)`    | `os.name` is `ipados` or `device.model` is `iPad`  | no             |
| `isIPadOS(info)`  | `os.name` is `ipados`                              | `os.name`      |
| `isInApp(info)`   | `context.type` is `in-app-browser` or `mini-app`   | `context.type` |
| `isWebView(info)` | `browser.mode` is `webview`                        | `browser.mode` |

`isIPad` is not a type predicate because either the OS or the model can establish it. Use `isIPadOS` when you need `os.name` narrowed.

## Display

### `labels`

A table per dimension: `browser`, `os`, `engine`, `device`, `cpu`, `vendor`, `client`, and `context`. Index it only with a non-null id.

```ts
labels.browser.chrome; // 'Google Chrome'
```

### `label(kind, id, fallback?)`

```ts
type LabelKind = keyof typeof labels;

function label(kind: LabelKind, id: string | null | undefined, fallback?: string): string;
```

Returns the display name, or `fallback` when the id is missing or unknown. The default fallback is `'Unknown'`.

### `describe(info)`

```ts
function describe(info: UAInfo): string;
```

Returns one line such as `Google Chrome 150.0.0.0 on Windows 10 (Desktop)`. It is intended for logs and UI text, not for stable machine keys.

## Contract

- `parse()` never throws. `detect()` throws outside a browser runtime.
- Ids are lowercase and stable. Renaming or removing one is a major release.
- `browser.name` and `browser.family` are independent evidence. A Chromium fork with no catalog row reports `{ name: null, family: 'chromium' }`.
- Known host-app metadata is ignored only for the context that owns it. An unknown string with the same products still reports no browser.
- Detection is not authentication. User-Agent and Client Hints are client-provided claims.
