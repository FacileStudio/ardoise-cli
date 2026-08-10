# ardoise-cli

Batch generator for French freelance paperwork. It reads one YAML job file and compiles
Typst templates into PDFs: invoices, maintenance quotes, and the two matching contracts.

This repo has **nothing to do with the `Ardoise` invoicing product**. Same French word,
different project: `Ardoise` is a deployed invoicing app with Stripe and a database, while
`ardoise-cli` is a standalone Bun binary that turns a YAML file into PDFs and stores
nothing. They share no code and no data. This is a documented suite gotcha; do not wire
them together on the strength of the name.

## What it does

- Reads provider, client, and document data from a single YAML job file
- Generates a service invoice, a maintenance quote, and both matching contracts
- Emits only the document types actually present in the YAML file
- Injects values into `{{placeholder}}` tags in the Typst templates
- Compiles each document with the `typst` CLI and removes the intermediate `.typ`
- Names the output from the client name, or from an explicit `output_name`
- Writes to the current directory, or to a target directory of your choice

## Stack

| Layer | Tech |
|---|---|
| CLI | Bun (TypeScript, ESM), `node:util` `parseArgs`, `src/ui.ts` for terminal output |
| Runtime | `Bun.YAML` for parsing, `Bun.spawnSync` to drive the `typst` CLI |
| Storage | None — a YAML file in, PDFs out |

Typst is an external prerequisite, not a dependency: the binary shells out to
`typst compile`.

## Install

```sh
curl -fsSL https://raw.githubusercontent.com/FacileStudio/ardoise-cli/main/install.sh | bash
```

Installs to `~/.local/bin` via [facile](https://github.com/FacileStudio/facile), the suite
installer. Pass `--bin-dir <dir>` to change that, `--source` to build from source.

Already have `facile`:

```sh
facile install ardoise
```

The [Typst](https://typst.app) CLI must be on your `PATH` at runtime — `ardoise` shells
out to `typst compile`.

## Usage

```sh
ardoise                          # reads ./job.yml, writes PDFs next to it
ardoise -f clients/spacex.yml    # a different job file
ardoise -f spacex.yml -o out/    # write the PDFs into out/
```

One run produces one PDF per document block found in the YAML. Full reference:
[docs/usage.md](docs/usage.md).

## Configuration

There are no environment variables. Everything lives in the job file, `./job.yml` by
default.

| Block | What it does |
|---|---|
| `prestataire` | Your own details — name, address, SIRET, bank, `tva_rate` |
| `client` | The billed party |
| `prestation` | Emits a service invoice |
| `maintenance` | Emits a maintenance quote |
| `contrat_prestation` | Emits a service contract |
| `contrat_maintenance` | Emits a maintenance contract |

The repo's `job.yml` is a working example with fictional data. Full reference:
[docs/configuration.md](docs/configuration.md).

## Structure

```
src/
  index.ts        Argument parsing and the generation loop
  config.ts       Document type registry — labels and filename prefixes
  processor.ts    YAML to template variable mapping, {{tag}} injection
  utils.ts        YAML loading and the typst compile call
  ui.ts           Suite-standard output helper — glyphs, colors, streams
  version.ts      Version string, inlined from package.json at build time
  templates/      Typst source for each document, stored as TypeScript strings
job.yml           Example and default job file
docs/             Architecture, configuration, development, usage
```

## Documentation

| Doc | What's in it |
|---|---|
| [Architecture](docs/architecture.md) | Generation pipeline, variable mapping, template contract |
| [Configuration](docs/configuration.md) | Every job file key and every template variable |
| [Development](docs/development.md) | Local setup, adding a template, building the binary |
| [Usage](docs/usage.md) | Every flag, with examples and output naming rules |

---

Part of the [Facile Suite](https://facile.studio) — self-hosted tools for creative studios
and freelancers. One login, zero cloud dependency.
