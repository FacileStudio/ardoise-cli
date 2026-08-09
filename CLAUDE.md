# ardoise-cli

Freelance document generator -- reads a YAML job file and produces Typst-compiled PDFs (invoices, quotes, maintenance contracts, service contracts).

## Tech Stack

- **Runtime**: Bun (TypeScript)
- **Templating**: Typst (`.typ` files compiled to PDF via the `typst` CLI)
- **Terminal output**: `src/ui.ts`, the Facile CLI standard helper (glyphs, color, streams)
- **Config format**: YAML (`job.yml`), parsed with `Bun.YAML`

## Prerequisites

- [Bun](https://bun.sh) installed
- [Typst](https://typst.app) CLI installed and on `$PATH`

## Commands

```bash
bun install              # install dependencies
bun run start            # run the generator (reads ./job.yml by default)
bun run build            # compile to a standalone binary: ./ardoise
./install.sh --source    # clone, build, install into ~/.local/bin
```

### CLI flags

```
-f, --file <path>   Path to a YAML job file (default: ./job.yml)
-o, --out  <dir>    Output directory for generated files
    --no-color      Disable colored output
-h, --help          Show this help
-V, --version       Show version
```

## Project Structure

```
src/
  index.ts              entry point -- CLI arg parsing, orchestration loop
  config.ts             document type registry (prestation, maintenance, contrat_*)
  processor.ts          variable mapping and Mustache-style {{tag}} injection
  utils.ts              YAML loading, Typst compilation (spawns `typst compile`)
  ui.ts                 output helper -- glyphs, color discipline, stdout/stderr split
  version.ts            version string, inlined from package.json at build time
  templates/
    index.ts            re-exports all templates
    prestation.ts       invoice template (Typst source as string)
    maintenance.ts      maintenance quote template
    contrat-prestation.ts   service contract template
    contrat-maintenance.ts  maintenance contract template
job.yml                 example/default job configuration
demo.tape              VHS tape file for recording demo GIF
install.sh             suite-standard installer; only its 9-line config block is repo-specific
```

## How It Works

1. Reads a YAML job file (`job.yml`) containing provider, client, and document data.
2. For each document type key present in the YAML (`prestation`, `maintenance`, `contrat_prestation`, `contrat_maintenance`), it picks the matching Typst template.
3. Maps YAML values to template variables via `mapVariables()` in `processor.ts`.
4. Injects variables into `{{placeholder}}` tags in the template string.
5. Writes the `.typ` file, calls `typst compile` to produce a PDF, then deletes the intermediate `.typ` file.

## Conventions

- Templates are raw Typst source stored as TypeScript string exports, not `.typ` files on disk.
- Variable placeholders use double-brace syntax: `{{variable_name}}`.
- Unresolved numeric-looking placeholders default to `"0.00"`; others default to empty string.
- Generated output filenames follow the pattern `{prefix}_{ClientName}.pdf` unless `output_name` is set in the YAML.
- Runtime output follows `Wiki/CLI-STANDARD.md`: English, glyphs `▸ ✓ ! ✗`, warnings and
  errors on stderr, no emoji. Everything routes through `src/ui.ts`; never `console.error`.
- Exit codes: `0` success, `1` error or partial failure, `2` usage error.
- Document content stays French; the CLI's own output does not.
- Bump the version in `package.json` only -- `src/version.ts` reads it and the bundler inlines it.
- Do not edit `install.sh` below its config block: that body is byte-identical across the suite.
