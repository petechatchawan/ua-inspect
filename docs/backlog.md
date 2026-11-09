# ua-inspect audit and backlog

Point-in-time review of `ua-inspect@1.1.1` on 2026-11-09, followed by the `1.1.2`, `1.2.0`, `1.3.0`, and `1.4.0` releases. It covers code, packaging, tests, docs, the developer experience of the package, and the experience of using it with AI-assisted coding.

The review is based on:

- reading every file under `src/`
- running the test suite, coverage, build, and `pack:check` against the built tarball
- exercising the public API against the built `dist`
- compiling TypeScript consumers for both ESM and CommonJS
- fuzzing `parse()` with 50,000 random inputs
- measuring bundle size and throughput
- reading the playground source and its screenshots

P0 shipped in `1.1.2`, P1 in `1.2.0`, REV-01 in `1.3.0`, and the remaining P2 items in `1.4.0`.

## Legend

Priority:

- **P0**: wrong result, broken consumer, or a contract violation. Fix before the next patch.
- **P1**: high-friction DX, docs, or AI-readiness gap. Next minor.
- **P2**: cleanup, refactor, or optional helper. Do it when touching the area.

Type: `fix`, `refactor`, `revamp`, `docs`, `test`, `chore`.

Size: **S** is under half a day, **M** is half a day to two days, **L** is more than two days.

## Release plan

| Release | Scope                                                              | Exit criteria                                                                                                                                         |
| ------- | ------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| `1.1.2` | P0 correctness, packaging, and docs                                | `npm run check` passes with a writable npm cache, new regressions cover every P0, and the packed tarball compiles from a CommonJS TypeScript consumer |
| `1.2.0` | P1 DX, docs revamp, AI context, playground, semver policy          | all new public exports have JSDoc, the README quickstart compiles, and the AI cheat sheet is linked from the README                                   |
| `1.3.0` | REV-01 and selected P2 fixes                                       | no behavior change unless listed, tests stay above the current coverage thresholds                                                                    |
| `1.4.0` | Remaining P2: REF-01, NIT-06, and two documented decisions         | all P2 items are resolved or explicitly kept                                                                                                          |
| `1.5.0` | DX: `label`, Thai quickstart, Hono and Fastify recipes, Node 24 CI | new helper is documented, examples compile, and CI covers Node 18 to 24                                                                               |
| `1.6.0` | Catalog Tier 2 from `docs/coverage.md`                             | every new row has a real captured string and a fixture test                                                                                           |
| `2.0.0` | only if a breaking interface change is accepted                    | a migration guide and a major version                                                                                                                 |

No item in this backlog requires `2.0.0`.

## At a glance

| Priority | Items                                                                        | Release |
| -------- | ---------------------------------------------------------------------------- | ------- |
| P0       | FIX-01 to FIX-08, TEST-01                                                    | `1.1.2` |
| P1       | DX-01 to DX-04, DOC-01 to DOC-03, REV-01, REV-02, SEM-01, TEST-02 to TEST-04 | `1.2.0` |
| P2       | REF-01 to REF-07, NIT-01 to NIT-06                                           | `1.4.0` |

The product decisions are resolved: REV-01 shipped in `1.3.0`, and NIT-01 and NIT-03 were kept and documented in `1.4.0`.

## P0: fix before the next patch

**Status.** Implemented in `1.1.2`. Keep this section as the record of what changed.

### FIX-01 CommonJS TypeScript consumers cannot compile

- Type: `fix`
- Area: packaging, types
- Size: S
- Release: `1.1.2`

**Problem.** The export map points the `types` condition at `dist/esm/index.d.ts` for both `import` and `require` ([package.json](../package.json#L25-L56)). The ESM build is marked as a module by `dist/esm/package.json`, while `dist/cjs` has no declaration files because [tsconfig.build.cjs.json](../tsconfig.build.cjs.json#L6) sets `declaration: false`.

**Evidence.** A CommonJS TypeScript consumer using `module: Node16` gets `TS1479` on all entry points, while `require()` works at runtime:

```text
consumer.ts(1,36): error TS1479: The current file is a CommonJS module whose imports will
produce 'require' calls; however, the referenced file is an ECMAScript module and cannot be
imported with 'require'.
```

The package consumer check misses it because the workspace created in [verify-consumers.mjs](../scripts/verify/verify-consumers.mjs) contains `"type": "module"`, so only an ESM TypeScript consumer is tested.

**Change.**

1. Emit declarations for the CommonJS build, for example by removing `declaration: false` from [tsconfig.build.cjs.json](../tsconfig.build.cjs.json).
2. Use nested conditions so each resolution mode gets the matching declaration file:

```json
".": {
    "import": { "types": "./dist/esm/index.d.ts", "default": "./dist/esm/index.js" },
    "require": { "types": "./dist/cjs/index.d.ts", "default": "./dist/cjs/index.js" }
}
```

3. Add a second fixture without `"type": "module"` and compile it with `module: Node16`.

**Acceptance.** A CommonJS TypeScript fixture imports all five entry points and compiles. The ESM fixture still compiles. `pack:check` runs both.

### FIX-02 Low-entropy Client Hints downgrade the browser version

- Type: `fix`
- Area: Client Hints merge
- Size: S
- Release: `1.1.2`

**Problem.** [strongestVersion](../src/core/match.ts#L245-L252) always prefers the `hints` source, but the default `sec-ch-ua` header carries only a major version.

**Evidence.**

```text
parse(ua).browser.version                                    { full: '130.0.6723.92', minor: 0, patch: 6723 }
parseRequest({ ua, 'sec-ch-ua': ...v="130" }).browser.version { full: '130', minor: null, patch: null }
parseRequest({ ua, 'sec-ch-ua-full-version-list': ... })      { full: '130.0.6723.92', ... }
```

The existing tests only pass full versions through hints ([client-hints.test.ts](../test/unit/client-hints.test.ts#L81-L94)), so the common low-entropy path is untested. The same policy makes `detect()` return a major-only version when the brand list names Chrome.

**Change.** Make the version merge explicit. One acceptable rule:

- if the hint major equals the User-Agent major and the hint has fewer numeric segments, keep the User-Agent version;
- if the majors differ, keep the hint;
- if the hint has a longer version, keep the hint.

**Acceptance.** A regression test with `Chrome/130.0.6723.92` plus `sec-ch-ua: "Google Chrome";v="130"` returns `130.0.6723.92`. The full-version-list case still returns the hint version. A conflicting major still resolves to the hint.

### FIX-03 Client Hints model bypasses model validation

- Type: `fix`
- Area: device detection
- Size: S
- Release: `1.1.2`

**Problem.** [resolveDevice](../src/core/device.ts#L149-L155) applies `splitBrand()` directly to `hints.model` and skips `cleanModel()` ([device.ts](../src/core/device.ts#L57-L66)), so placeholders, locales, and oversized values become `device.model`.

**Evidence.**

```text
sec-ch-ua-model: "K"      -> { model: "K" }
sec-ch-ua-model: "en-US"  -> { model: "en-US" }
sec-ch-ua-model: <60 M>   -> { model: "MMMM..." }  // 60 characters
```

This contradicts the documented rule that placeholders such as `K` are not models.

**Change.** Run the hint model through the same `cleanModel()` used by the User-Agent path, including the 48 character cap, locale rejection, metadata rejection, and build marker trimming.

**Acceptance.** `K`, `en-US`, `wv`, and a 60 character model all yield `null`. A real model such as `SM-S928B` and `samsung SM-S928B` still resolve.

### FIX-04 CPU bitness can contradict the architecture

- Type: `fix`
- Area: CPU resolution
- Size: S
- Release: `1.1.2`

**Problem.** [resolveCPU](../src/core/resolve.ts#L265-L284) applies a lone `bitness` hint over the existing architecture.

**Evidence.**

```text
UA x86_64 + sec-ch-ua-bitness: 32 -> { architecture: 'x86_64', bitness: 32 }
UA arm64  + sec-ch-ua-bitness: 32 -> { architecture: 'arm64',  bitness: 32 }
```

Both pairs are impossible in hardware.

**Change.** Ignore a bitness hint when no architecture hint accompanies it, or derive a compatible architecture before applying it. The result must never pair a 64-bit architecture with a 32-bit value.

**Acceptance.** Tests cover `x86_64` with bitness 32, `arm64` with bitness 32, and an architecture-only hint. No result contains an impossible pair.

### FIX-05 `is()` narrows fields the query did not name

- Type: `fix`
- Area: type definitions
- Size: S
- Release: `1.1.2`

**Problem.** [Has](../src/check.ts#L41-L42) checks only whether a key exists in the type, not whether its value can be `undefined`. A query widened to `Query` therefore claims narrowing for every field.

**Evidence.**

```ts
const q: Query = { os: 'android' };
if (is(info, q)) {
    const name: BrowserId = info.browser.name; // compiles
}
```

At runtime `is(info, q)` returns `true` and `info.browser.name` is `null`. This is exactly the config-driven pattern that AI-generated code produces.

**Change.** Make the presence check reject optional or undefined values, for example:

```ts
type Has<Q extends Query, K extends keyof Query> = K extends keyof Q
    ? undefined extends Q[K]
        ? false
        : true
    : false;
```

**Acceptance.** A widened `Query` no longer narrows unnamed fields, while an object literal still narrows. Add a compile-only test that covers both. Note in the changelog that this only removes narrowing that was never true at runtime.

### FIX-06 `parseRequest()` throws on malformed header values

- Type: `fix`
- Area: input boundary
- Size: S
- Release: `1.1.2`

**Problem.** [readHeader](../src/server.ts#L21-L32) calls `.join()` on any value that is not a string. A `null` or numeric value throws a raw `TypeError` instead of being ignored.

**Evidence.**

```text
parseRequest({ 'user-agent': null }) -> TypeError: Cannot read properties of null (reading 'join')
parseRequest({ 'user-agent': 42 })   -> TypeError: value.join is not a function
```

Header data sits at a trust boundary, so it should be validated there.

**Change.** Coerce the value: string stays as is, an array joins with `", "`, and everything else becomes `null`. Keep the current behavior for a missing value.

**Acceptance.** Tests cover `null`, a number, an object, an empty array, and a normal array. None throws.

### FIX-07 The README labels example does not compile

- Type: `docs`
- Area: README
- Size: S
- Release: `1.1.2`

**Problem.** [README.md](../README.md#L155) shows `labels.browser[info.browser.name]` while `browser.name` is nullable. Under `strict`, TypeScript reports `TS2538`.

**Change.** Use the guarded form already shown later in the file ([README.md](../README.md#L460)), or add a `label()` helper that accepts `null` and returns a fallback.

**Acceptance.** The snippet compiles in the quickstart check added by TEST-01.

### FIX-08 Documentation counts have drifted

- Type: `docs`
- Area: coverage document
- Size: S
- Release: `1.1.2`

**Problem.** [coverage.md](coverage.md#L198) says there are 107 per-dimension fixtures. The corpus currently holds 109, plus 27 first-party captures.

**Change.** Correct the count and add a script or test that counts the files, so the number cannot drift again.

**Acceptance.** The documented count matches a computed count in CI.

### TEST-01 Regression coverage for every P0 fix

- Type: `test`
- Size: S
- Release: `1.1.2`

Add:

- a CommonJS TypeScript consumer fixture (FIX-01)
- a low-entropy Client Hints case (FIX-02)
- `K`, `en-US`, and an oversized model hint (FIX-03)
- lone bitness for `x86_64` and `arm64` (FIX-04)
- a widened `Query` type test (FIX-05)
- null and numeric header values (FIX-06)
- a compile check for the README quickstart (FIX-07)

**Acceptance.** Each test fails on the current release and passes after the fix.

## P1: DX and product revamp for 1.2.0

**Status.** Implemented in `1.2.0`. REV-01 shipped in `1.3.0`.

### DX-01 Export the query and label helpers from the root

- Type: `revamp`
- Area: public entry points
- Size: S
- Release: `1.2.0`

**Problem.** The root entry exports only `parse` at runtime. `is`, `isBot`, and `labels` live in subpaths, so the most common AI-generated import fails:

```text
import { parse, isBot, labels } from 'ua-inspect';
-> TS2305: no exported member 'isBot', 'labels'
```

**Evidence.** Bundle measurement with esbuild shows the convenience exports are cheap because the catalogs are already part of the parser bundle:

| Bundle                       | Minified | Gzip    |
| ---------------------------- | -------- | ------- |
| `parse` only                 | 29,729 B | 9,181 B |
| `parse` + `check` + `labels` | 30,549 B | 9,429 B |

The cost is about 250 bytes gzip.

**Change.** Re-export `is`, `isBot`, `isMobile`, `isTablet`, `isDesktop`, `isIPad`, and `labels` from `src/index.ts`. Keep `ua-inspect/server` and `ua-inspect/browser` as subpaths because they carry runtime-specific code. Update the README entry table to show both styles.

**Acceptance.** `import { parse, is, isBot, labels } from 'ua-inspect'` compiles and runs. A bundle budget test fails above 11 KB gzip for the root entry.

### DX-02 JSDoc on every public API

- Type: `docs`
- Area: published types
- Size: S
- Release: `1.2.0`

**Problem.** The published declarations for the three main functions carry no documentation:

```ts
export declare function parse(userAgent: string | null | undefined): UAInfo;
export declare function parseRequest(input: ParseRequestInput): UAInfo;
export declare function detect(options?: DetectOptions): Promise<UAInfo>;
```

`check.ts` and `labels.ts` are documented, so the gap is inconsistent. IDE hover and AI agents that read `node_modules` see only signatures.

**Change.** Add a short description, the null contract, the read limit, and a runnable `@example` to each entry point. Do the same for `Version` and the header types. Verify the comments survive into `dist/esm/*.d.ts`.

**Acceptance.** A docs test asserts that each public declaration contains a JSDoc block and an `@example`.

### DX-03 Add `Version.toString()` and `atLeast()`

- Type: `revamp`
- Area: version ergonomics
- Size: S
- Release: `1.2.0`

**Problem.** `Version` is an object, so the obvious comparisons fail:

```text
`${info.browser.version}`        -> "[object Object]"
String(info.browser.version)     -> "[object Object]"
parseFloat(info.browser.version) -> NaN
info.browser.version > 120       -> false
```

The README admits that callers must write their own comparison helper ([README.md](../README.md#L367-L369)). This is the most common real task, and AI-generated code gets it wrong often.

**Change.** Add `toString()` returning `full`, and export a null-safe helper from the check entry:

```ts
export function atLeast(version: Version | null, minimum: string): boolean;
```

Optionally add `compareVersion(a, b): -1 | 0 | 1`.

**Acceptance.** Template strings and `String()` return the dotted version. `atLeast(null, '120')` is `false`. Tests cover equal, greater, lower, missing minor, and missing patch.

### DX-04 Development warnings for unsafe queries

- Type: `revamp`
- Area: `is()`
- Size: M
- Release: `1.2.0`

**Problem.** In JavaScript, or in TypeScript after a cast, several mistakes return a plausible but wrong answer:

| Code                              | Result  | Consequence                               |
| --------------------------------- | ------- | ----------------------------------------- |
| `is(info, { brower: 'chrome' })`  | `true`  | typo passes every request                 |
| `is(info, {})`                    | `true`  | conditionally built query blocks everyone |
| `is(info, { client: 'boot' })`    | `false` | never matches                             |
| `is(info, { browser: 'Chrome' })` | `false` | never matches                             |

**Change.** When not in production, warn once per unknown query key and once for an empty query. Guard the environment check so browser bundles do not break:

```ts
if (typeof process !== 'undefined' && process.env.NODE_ENV !== 'production') {
    // warn
}
```

Do not throw in production and do not change the return value.

**Acceptance.** Tests with a `console.warn` spy cover a typo key, an empty query, and a valid query. Production builds emit no warning code path in the bundle.

### DOC-01 Revamp the README for first-time readers

- Type: `revamp`
- Area: documentation structure
- Size: M
- Release: `1.2.0`

**Problem.** The README is 526 lines and 25 KB, with no table of contents, no troubleshooting section, and no consolidated list of common mistakes. The important warning about phone ids is buried in the browser section.

**Change.**

1. Add a table of contents.
2. Add a 60-second quickstart with three lines: install, parse, query.
3. Add a "choose your entry point" decision table (server, browser, pure parsing, labels, checks).
4. Add a "common mistakes" table with the wrong and right code from DX-04 and FIX-02.
5. Add troubleshooting for `detect()` on the server, `labels` returning `undefined`, `Version` not being a string, and `is(info, {})`.
6. Put the 1.1.0 phone id change at the top of the browser section with a migration note.
7. Optionally add a Thai quickstart if the LINE market is a target audience.

**Acceptance.** A reader can go from install to a working query without scrolling past the entry point table. Every code block used as a quickstart is compiled by TEST-02.

### DOC-02 Add an AI context pack

- Type: `revamp`
- Area: AI-assisted development
- Size: S
- Release: `1.2.0`

**Problem.** The package is five days old at the time of this audit, so models have little or no training data for it. There is no `llms.txt`, no `AGENTS.md`, and the README is too large to paste into every prompt.

**Change.** Add a one-page cheat sheet, either `llms.txt` or `docs/ai.md`, with:

- the five correct imports
- six recipes: bot block, phone, tablet, iPad, version gate, in-app context
- five pitfalls: typo keys, empty query, phone ids, `Version` is an object, `detect()` throws outside a browser
- the null contract and the stable id rule

Link it from the README with a heading aimed at AI assistants and contributors. Add an `AGENTS.md` for the repository itself with build, test, and catalog rules.

**Acceptance.** The cheat sheet fits in one page, every snippet compiles, and the README links to it.

### DOC-03 Framework recipes

- Type: `docs`
- Area: examples
- Size: M
- Release: `1.2.0`

**Problem.** The only framework example is Express. The generic fetch example does not show Next.js middleware, Hono, Fastify, or Cloudflare Workers, which are common targets for AI-assisted projects.

**Change.** Add tested recipes for:

- Next.js middleware and a client component that calls `detect()`
- Hono middleware
- Fastify hook
- Cloudflare Workers `fetch`
- Express middleware (keep the existing one)

Each recipe must compile against the packed tarball.

**Acceptance.** The Web API and Node recipes compile from `docs/examples` in CI. The Next.js, Hono, Fastify, and Express snippets use the same calls with their own types.

### REV-01 Decide the in-app and Electron browser identity policy

- Type: `revamp`
- Area: browser resolution
- Size: M
- Release: `1.2.0`
- Decision needed

**Problem.** The unaccounted-product rule drops a fallback browser whenever the User-Agent contains a top-level product that no row accounts for ([resolve.ts](../src/core/resolve.ts#L50-L58), [resolve.ts](../src/core/resolve.ts#L103-L105)). TikTok Android and Discord desktop therefore report `browser.name: null` and `version: null` even though the string names `Chrome/120`.

**Evidence.** The behavior is intentional and pinned in [tiktok.json](../test/data/context/tiktok.json). In the stored corpus, 5 of 109 vectors report a null browser although the string names Chrome or Safari: `android-browser-4-huawei-u9508`, `discord-linux-0-0-26`, `tiktok-lite-android-8`, and the two TikTok Android vectors.

**Options.**

1. Give each context row a list of metadata tokens it may ignore, for example `JsSdk`, `NetType`, `Channel`, `AppName`, `app_version`, `ByteLocale`, `ByteFullLocale`, `Region`, and `BytedanceWebview` for TikTok. The rule stays strict for unknown forks.
2. Keep the null identity and document it as a known limit.
3. Expose the Chromium build version even when the name is null, for callers that only need a version floor.

**Recommendation.** Option 1 with a context-scoped list. It fixes the common in-app case without weakening the rule for unknown products.

**Status.** Implemented in `1.3.0` with `ignores` on the TikTok, TikTok Lite, and Discord context rows.

**Acceptance.** After the change, a TikTok Android string reports `chrome-mobile` with `mode: webview`, while an unknown fork still reports a null name. The existing null cases are either updated deliberately or documented.

### REV-02 Fix the playground copy example and add permalinks

- Type: `revamp`
- Area: playground
- Size: M
- Release: `1.2.0`

**Problem.** When Client Hints are present, the generated snippet references an undefined variable:

```ts
import { parseRequest } from 'ua-inspect/server';

const result = parseRequest({
    userAgent: '...',
    headers: clientHints,
});
```

Copying it produces a `ReferenceError`. The playground also keeps no state in the URL, so a scenario cannot be shared.

**Change.**

1. Pass the parsed headers into [createCodeExample](../apps/playground/src/app/playground-view-model.ts#L159-L180) and serialize them into the snippet.
2. Store the mode, User-Agent, and hint text in the query string and restore them on load.
3. Add a test that the copied snippet contains no undeclared identifier.

**Acceptance.** The copied snippet runs as is. A shared URL restores the same input and result.

### SEM-01 Publish a semver policy and lock the stable ids

- Type: `chore`
- Area: release process
- Size: S
- Release: `1.2.0`

**Problem.** The 1.1.0 release changed `browser.name` for phone builds and `is(info, { browser: 'chrome' })` stopped matching them. That is a breaking change shipped in a minor version. The changelog acknowledges it as "a minor version by request", which tells consumers not to rely on semver.

**Change.**

1. State the policy in `CONTRIBUTING.md` or `AGENTS.md`: renaming or removing an id is a major change, adding an id is a minor change, and changing a result for an existing string is at least a minor change.
2. Add a snapshot test of every id in `labels`. Updating the snapshot requires an explicit changelog entry.
3. Add a migration table for the 1.1.0 ids to the README.

**Acceptance.** Removing or renaming an id fails a test until the snapshot and changelog are updated.

### TEST-02 Compile the documented snippets

- Type: `test`
- Size: M
- Release: `1.2.0`

**Problem.** The README already shipped one snippet that does not compile, and the pack check only validates advertised ids.

**Change.** Move the quickstart and framework snippets into a `docs/examples/` folder that CI compiles against the packed tarball, and include that file in the README with a comment or a copy script. If extracting from Markdown is preferred, tag the compilable blocks and wrap the declarations they assume.

**Acceptance.** A snippet that stops compiling fails CI.

### TEST-03 Stable id snapshot

- Type: `test`
- Size: S
- Release: `1.2.0`

Snapshot the sorted ids of every `labels` table. A difference fails the test with a message that tells the author to update the snapshot and the changelog, and to bump the major version when an id disappears.

### TEST-04 Bundle and pack budgets

- Type: `test`
- Size: S
- Release: `1.2.0`

Add a small check, using the existing esbuild dependency in the playground or a new dev dependency, that fails when:

- the packed tarball exceeds 60 KB
- the root bundle exceeds 11 KB gzip
- the `check`-only bundle exceeds 2 KB gzip

The current values are about 55 KB, 10.7 KB gzip, and 1.1 KB gzip after the 1.4.0 changes.

## P2: refactors and small fixes

**Status.** All P2 items are resolved. REF-01 and NIT-06 shipped in `1.4.0`. NIT-01 and NIT-03 were kept as documented behavior.

These are not required for correctness. Ship them when the area is already being changed.

### REF-01 Resolve the OS candidates once

**Status.** Implemented in `1.4.0`.

- Type: `refactor`
- Size: M
- Evidence: [resolve.ts](../src/core/resolve.ts#L321-L323) calls `resolveOS` twice whenever hints are present, once with hints and once without, only to gate the browser decision.
- Change: split `resolveOS` into `matchOS(scanned)` and `applyOSHints(candidates, hints)`, then pass the User-Agent-only result to `resolveBrowser`.

### REF-02 Centralize the version merge policy

- Type: `refactor`
- Size: S
- Change: after FIX-02, keep one documented function that decides between User-Agent and Client Hints versions. Name the policy in the code and test every branch. Remove the source-strength sort from `strongestVersion` if it no longer expresses the rule.

### REF-03 Share model validation between the two paths

- Type: `refactor`
- Size: S
- Change: after FIX-03, make `cleanModel` the only entry point for a model string, from the User-Agent or from Client Hints. Keep the vendor split separate.

### REF-04 Make header reading total

- Type: `refactor`
- Size: S
- Change: after FIX-06, keep coercion and iteration in one function. Consider accepting a `Map` as well as a `Headers`-like object, since `Map.get` already matches the structural check.

### REF-05 Remove the `labelOf` wrapper

- Type: `refactor`
- Size: S
- Evidence: [device.ts](../src/core/device.ts#L158-L160) only unwraps a nullable match.
- Change: inline it or rename it to say what it does.

### REF-06 Make `isIPad` consistent with the other device predicates

- Type: `refactor`
- Size: S
- Problem: `isMobile`, `isTablet`, and `isDesktop` are type predicates, while `isIPad` returns `boolean`. The name suggests a predicate.
- Options: add a proper predicate for the `ipados` case, rename the current function to `looksLikeIPad`, or document the difference. Prefer a predicate that narrows `os.name` to `'ipados'` only, since the iPad model case can also be `ios`.

### REF-07 Warn on non-string `parse()` input

- Type: `refactor`
- Size: S
- Problem: `parse(request)` returns an all-null result with no signal, while the type rejects it.
- Change: in development, warn once when the value is neither a string nor `null` nor `undefined`. Keep the never-throw contract.

### NIT-01 Reconsider the generic bot suffix rule

**Status.** Kept and documented. The suffix is deliberate because most bot names are not separated, so `Robot/1.0` reads as a bot.

- Type: `fix`
- Size: S
- Evidence: `parse('Robot/1.0')` reports `client.type: 'bot'` because [GENERIC_BOT_SUFFIXES](../src/catalog/clients.ts#L95) uses `endsWith('bot')`.
- Options: require a word boundary, keep a small allowlist of known bot names, or document the false positive. A boundary rule would miss names such as `FancyBot`, so document the tradeoff before changing it.

### NIT-02 Fill the OS version when an iPad is recovered from touch evidence

- Type: `fix`
- Size: S
- Evidence: `detect()` on an iPad in desktop mode reports `os: { name: 'ipados', version: null }` although the Safari `Version/17.0` token is present.
- Change: reuse the `Version/` token when the recovered OS is iPadOS and the browser is Safari.

### NIT-03 Decide the array User-Agent header behavior

**Status.** Kept and documented. An array joins with `, `, and two client products in the joined value conflict, so `client` stays `null`.

- Type: `fix`
- Size: S
- Evidence: `parseRequest({ 'user-agent': ['curl/8.4.0', 'wget/1.20'] })` joins both values and then returns a null client because two clients conflict.
- Options: use the first value, reject the header, or keep the join and document it. Most runtimes do not send an array for this header, so this is a low-priority decision.

### NIT-04 Clarify two documentation statements

- Type: `docs`
- Size: S
- `Version.patch` is the third numeric segment, not a patch number in the semver sense. Say so in [types.ts](../src/types.ts#L11-L15).
- [README.md](../README.md#L74) says each header is read up to 1,024 characters. The User-Agent header is echoed in full in `info.ua` and only scanning is truncated. Reword it.

### NIT-05 Document the comment-group model limit

- Type: `docs`
- Size: S
- The model inside a second parenthetical group, such as the Instagram suffix, is not scanned. This is already in [coverage.md](coverage.md#L212-L214). Add a test that pins it so a future change does not silently alter it, or decide to scan every group in a later minor.

### NIT-06 Optional convenience helpers

**Status.** Implemented: `describe`, `isInApp`, and `isWebView` in `1.4.0`, and `label` in `1.5.0`.

- Type: `revamp`
- Size: S
- Candidates: `describe(info)` returning a single line such as `Chrome 130 on Windows 10, desktop`, `isInApp(info)`, `isWebView(info)`, and a null-safe `label(kind, id)`.
- Rule: add a helper only when it replaces a repeated multi-line recipe in the README. Keep the helpers in `check` or `labels` so the root bundle stays small.

## Test matrix

| Area        | Current                       | Add                                              |
| ----------- | ----------------------------- | ------------------------------------------------ |
| Public API  | 525 tests, 99.84% statements  | regressions for FIX-01 to FIX-06                 |
| Consumers   | ESM TS + CJS runtime          | CJS TS fixture, docs snippets                    |
| Docs        | README id check               | snippet compilation, count check, JSDoc presence |
| Stability   | catalog references and cycles | stable id snapshot                               |
| Performance | hostile input timing          | bundle and pack budgets                          |
| Playground  | 42 tests and e2e              | copied snippet validity, permalink restore       |

## Non-goals

- No new browser, OS, vendor, or bot rows. Catalog growth is separate work and should use the existing fixture rules.
- No change to the linear scanner, the null contract, or the zero-dependency runtime.
- No network, storage, or framework integration inside the package.
- No attempt to detect bots or browsers with certainty. The trust boundary statement stays.
- No breaking API cleanup in this backlog. If one is wanted, schedule it for 2.0.0.

## Guardrails

These properties are load-bearing. Do not lose them while fixing the items above.

- The result shape stays fixed and unknown values stay `null`. No `"unknown"` sentinel and no omitted keys.
- Ids stay lowercase, stable, and typed. `labels` keeps a display name for every id.
- The runtime stays dependency free. No network, storage, or framework code enters `src`.
- `src` stays free of regular expressions, and every scan loop stays linear with the existing caps.
- One precedence rule decides every dimension. New rows are data, not special cases in `resolve`.
- Stored fixtures stay real captures. A composed string does not enter `test/data`.
- ESM, CommonJS, and TypeScript declarations stay published together.

## Definition of done

Every item, regardless of size:

1. Code and regression tests land together.
2. `npm run check` passes with a writable npm cache, and `npm run playground:check` passes when the playground changed.
3. The changelog has an entry under the target release.
4. The README or the AI cheat sheet is updated when a public behavior changes.
5. The bundle and pack budgets still pass.

## Suggested order

1. FIX-01 and FIX-06, plus their fixtures. These unblock consumers and remove a runtime crash.
2. FIX-02 to FIX-05, plus regressions. These are the silent wrong-answer cases.
3. FIX-07 and FIX-08. Then cut `1.1.2`.
4. DX-01 to DX-03 and the README revamp. These have the highest ratio of DX gain to effort.
5. DOC-02 with the AI pack, then DOC-03 and REV-02.
6. SEM-01 and TEST-02 to TEST-04.
7. REV-01 as a product decision, then the refactors when each area is next touched.
