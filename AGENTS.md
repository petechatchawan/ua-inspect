# AGENTS.md

Instructions for an agent working in this repository. For the package API, read [llms.txt](llms.txt). For user documentation, read [README.md](README.md).

## What this repository is

`ua-inspect` is a zero-dependency TypeScript User-Agent parser. Detection data lives in `src/catalog` as rows, not code. A single matcher and a single precedence rule resolve every dimension.

## Commands

```bash
npm ci
npm test                 # no build required
npm run typecheck
npm run lint
npm run check            # format, lint, typecheck, coverage, build, declarations, pack consumers
npm run playground:check # packed tarball installed into the playground, plus e2e
```

Development tests need Node.js 22.12 or later for Vitest 5. The package runtime stays on Node.js 18 and later.

Use a writable npm cache when the default cache is not writable:

```bash
npm_config_cache=/tmp/ua-inspect-npm-cache npm run check
```

## Layout

| Path                  | Role                                                                              |
| --------------------- | --------------------------------------------------------------------------------- |
| `src/core/scan.ts`    | One-pass tokenizer and `readVersion`                                              |
| `src/core/match.ts`   | `compileMatcher`, `pick`, `mergeVersion`, `strongestVersion`                      |
| `src/core/resolve.ts` | Dimension resolution and edge cases                                               |
| `src/core/device.ts`  | Model and vendor extraction                                                       |
| `src/catalog/*`       | Data rows: browsers, OS, clients, contexts, devices, vendors, CPUs                |
| `src/index.ts`        | Root exports: `parse`, `is`, `atLeast`, `describe`, `label`, predicates, `labels` |
| `test/data/*`         | Real captured User-Agent strings                                                  |
| `test/unit/*`         | Unit, contract, and fixture tests                                                 |
| `docs/examples/*`     | Compile-checked snippets                                                          |
| `apps/playground/*`   | Vite playground that consumes the packed tarball                                  |

## Rules

- No runtime dependencies. Dev dependencies are fine.
- No regular expressions in `src`. ESLint enforces this. The scanner is linear and bounded.
- Catalog rows are data. Put logic in `src/core` and test it there.
- Fixtures are real captures. Do not compose a User-Agent string.
- Reuse the existing precedence rule. Do not add per-dimension special cases unless the rule cannot express it.
- Keep every public id stable. `test/unit/stable-ids.test.ts` fails when an id disappears.
- Renaming or removing an id is a major release. Read [CONTRIBUTING.md](CONTRIBUTING.md) before changing one.
- Update `CHANGELOG.md` for any behavior change.
- Run Prettier. The repository uses 4 spaces, single quotes, semicolons, and a print width of 100.

## Where the design lives

- [docs/backlog.md](docs/backlog.md): known work, priorities, and acceptance criteria.
- [docs/coverage.md](docs/coverage.md): catalog coverage, fixture provenance, and known limits.
- [CONTRIBUTING.md](CONTRIBUTING.md): semver policy and release steps.
