# ardoise-cli — Usage

The full command surface. It is one command with three flags — everything else is decided
by the job file.

## Synopsis

```
ardoise [-f <path>] [-o <dir>]
```

There are no subcommands. Running the binary generates one PDF for each document block
present in the job file, then exits.

## Flags

| Flag | Type | Default | What it does |
|---|---|---|---|
| `-f, --file` | string | `./job.yml` | Path to the YAML job file |
| `-o, --out` | string | current directory | Directory to write the generated files into |
| `--no-color` | boolean | `false` | Disable colored output |
| `-h, --help` | boolean | `false` | Print usage and exit 0 |
| `-V, --version` | boolean | `false` | Print `ardoise <semver>` and exit 0 |

Color is also disabled when the target stream is not a TTY or `NO_COLOR` is set.

Parsing is strict. An unknown flag aborts the run with exit status 2 rather than being
ignored, and positional arguments are not accepted — pass the job file with `-f`, never as
a bare argument.

## Exit codes

| Code | Meaning |
|---|---|
| `0` | Every requested document was generated |
| `1` | The job file is missing or unparseable, or at least one document failed to compile |
| `2` | Usage error, such as an unknown flag |

## Generating from the default job file

```sh
ardoise
```

Reads `./job.yml`, writes each document beside it, and reports progress: a `▸` line naming
the job file, one `✓` line per generated PDF, and a closing `✓ <n> document(s) generated`.

With no `-f` and no `./job.yml` present, the command prints
`✗ no job file found — create ./job.yml or pass --file <path>` to stderr and exits 1. A file
that exists but is not valid YAML fails the same way.

## Choosing a job file

```sh
ardoise -f clients/spacex/job.yml
```

The opening line shows the file's basename — `▸ Reading job.yml` — so a per-client layout
stays readable. The path is used as given; nothing is resolved relative to the job file itself, so `-o` is
relative to your current directory, not to `-f`.

## Choosing an output directory

```sh
ardoise -f clients/spacex/job.yml -o out/2026-02
```

The directory is created recursively if it does not exist. Combined:

```sh
for c in clients/*/job.yml; do
  ardoise -f "$c" -o "out/$(basename "$(dirname "$c")")"
done
```

## What gets generated

One document per block found in the job file, in this fixed order:

| Job file block | Document | Default filename |
|---|---|---|
| `prestation` | Service invoice | `Facture_Presta_<client>.pdf` |
| `maintenance` | Maintenance quote | `Devis_Maint_<client>.pdf` |
| `contrat_prestation` | Service contract | `Contrat_Presta_<client>.pdf` |
| `contrat_maintenance` | Maintenance contract | `Contrat_Maint_<client>.pdf` |

`<client>` is `client.name` with every character outside `[a-z0-9]` replaced by `_`, so
`SpaceX Exploration Technologies` becomes `SpaceX_Exploration_Technologies`. Without a
`client.name`, it is the literal `Client`.

Set `output_name` inside a block to take over the whole name:

```yaml
contrat_prestation:
  number: "CONT-PRESTA-SPX-01"
  date: "05/02/2026"
  output_name: "Contrat_Projet_SpaceX"
```

That writes `Contrat_Projet_SpaceX.pdf`. The extension is always added by the tool; do not
put one in `output_name`.

To emit a single document, keep only its block in the job file — commenting out the other
three is the usual way.

## Intermediate files

Each document is written as a `.typ` next to its PDF, compiled, then deleted on success. A
`.typ` left behind means Typst failed on that document; its error is printed to stderr and
the run continues with the next one. A partial failure is still a failure: the run ends on
`✗ <n> document(s) generated, <m> failed` and exits 1.

## Authentication

None. The tool never opens a network connection, has no account, and stores no credentials.
Everything it needs is in the job file you point it at.

## Files it touches

| Path | Role |
|---|---|
| `./job.yml` | Default input, only when `-f` is omitted |
| `<out>/<name>.typ` | Intermediate Typst source, removed after a successful compile |
| `<out>/<name>.pdf` | The generated document |
| `~/.local/bin/ardoise` | Where `install.sh` puts the binary |

There is no config file, cache, or state directory of its own.
