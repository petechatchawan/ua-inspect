# Contributing

`ua-inspect` is a zero-dependency TypeScript User-Agent parser. Detection data is code-free catalog data, and every behavior is pinned by a test.

## Setup

```bash
npm ci
npm test
npm run check
```

`npm run check` runs formatting, lint, typecheck, coverage, build, declaration documentation, and the packed-tarball consumer checks. Use a writable npm cache if the default one is not writable:

```bash
npm_config_cache=/tmp/ua-inspect-npm-cache npm run check
```

## Layout

| Path                              | Role                                                              |
| --------------------------------- | ----------------------------------------------------------------- |
| `src/core`                        | The scanner, matcher, version merge, and dimension resolution     |
| `src/catalog`                     | Browser, OS, client, context, device, vendor, and CPU rows        |
| `src/index.ts`                    | Root entry: `parse`, `is`, `atLeast`, device predicates, `labels` |
| `src/check.ts`                    | Queries, predicates, and version comparison                       |
| `src/server.ts`, `src/browser.ts` | Request and browser adapters                                      |
| `test/data`                       | Real captured User-Agent strings                                  |
| `docs/examples`                   | Compile-checked snippets used by the README                       |

## Adding a catalog row

1. Add the row to the matching file under `src/catalog`. A row is data: match signals, an optional `beats` list, a label, and the row's type-specific fields.
2. Add a real captured string to `test/data/<dimension>/<name>.json`. Do not compose a string. If the capture is first-party, add it to `test/data/user-agents.json` with a `src` of the form `observed:<where>@<date>`.
3. Run `npm test`. The catalog tests check `beats` references, cycles, duplicate brands and platforms, vendor prefix collisions, and labels.
4. Run `npm run check`. It compares the README ids with the built catalog.

## Versioning

The public contract includes the result shape, the stable ids, the entry points, and the exported helpers.

| Change                                                                                   | Release |
| ---------------------------------------------------------------------------------------- | ------- |
| Rename or remove an id, change the result shape, or change a public signature            | Major   |
| Add an id, an entry point, or a helper; change a detection result for an existing string | Minor   |
| Fix a wrong result, an input crash, documentation, performance, or declarations          | Patch   |

Renaming `browser.name` for phone builds in `1.1.0` was a breaking change shipped as a minor. Do not repeat that. The stable-id snapshot in `test/unit/stable-ids.test.ts` fails when an id disappears, so the change cannot land without an explicit snapshot update and a changelog entry.

## Style

- Run Prettier. The repository uses 4 spaces, single quotes, semicolons, and a print width of 100.
- Do not use regular expressions in `src`. The scanner is linear and bounded on purpose.
- Keep catalog rows declarative. If a rule needs code, add it to `src/core` with a test.
- Comment the reason for a non-obvious rule, not the mechanics of the line.
- Do not add runtime dependencies.

## Releasing

1. Update `CHANGELOG.md`.
2. Run `npm version <version>`.
3. Push the tag with `master` in one push: `git push origin master v<version>`. The publish workflow only publishes when `HEAD` carries that tag and the repository is canonical. A `master` push that lands before the tag exists skips publication.
4. The tarball is built from the tree that passed `npm run check`, so do not publish from an older branch.
