# ardoise-cli — Development

Local setup, how to change a template, and how the standalone binary is produced.

## Prerequisites

- [Bun](https://bun.sh) — the runtime, the package manager, and the compiler
- The [Typst](https://typst.app) CLI on your `PATH`, since generation shells out to
  `typst compile`
- TypeScript 5 is declared as a peer dependency; Bun runs the sources directly, so there is
  no separate compile step during development

Verify Typst is reachable before debugging anything else:

```sh
typst --version
```

## Setup

```sh
bun install
```

The only runtime dependency is `@clack/prompts`; `@types/bun` is the only dev dependency.

## Run

```sh
bun run start
```

That is `bun run src/index.ts`, which reads `./job.yml` and writes the PDFs into the repo
root. Flags pass through:

```sh
bun run src/index.ts -f job.yml -o /tmp/out
```

Generated artifacts are gitignored: `generated-*.typ`, `*.pdf`, and the `ardoise` binary.

## Build and install

```sh
bun run build     # bun build src/index.ts --compile --outfile ardoise
./install.sh      # build, then copy ./ardoise to ~/.local/bin
```

`--compile` bundles the runtime, the sources, and the Typst templates into one executable,
so the installed binary has no dependency on the repo. It still needs `typst` at runtime.

## Tests

There are none, and no test runner is configured. The cheapest check is a full round trip:

```sh
bun run start -o /tmp/ardoise-check && ls /tmp/ardoise-check
```

Four PDFs and no leftover `.typ` files means the pipeline is intact. A leftover `.typ` marks
the document whose Typst compilation failed.

## Changing a document

Templates are Typst source stored as TypeScript template strings in `src/templates/`, not
`.typ` files. Editing one means editing a string, so keep two things in mind:

- backticks and `${` inside Typst source must be escaped, since the file is a template
  literal
- every `{{placeholder}}` you add must be produced by `mapVariables` in `src/processor.ts`,
  otherwise it silently renders empty

To iterate on layout, generate once, keep the intermediate file by making the compilation
fail, or run `typst compile` on a copy by hand.

## Adding a document type

Four edits, in this order:

1. Write the Typst source in `src/templates/<name>.ts` and export it under the key you want
2. Re-export it from `src/templates/index.ts`
3. Add an entry to `DOC_CONFIG` in `src/config.ts` with a `label` and a filename `prefix`
4. If the document needs derived variables, extend `mapVariables` in `src/processor.ts`

The generation loop iterates `DOC_CONFIG`, so nothing else needs touching. The new key
becomes active as soon as a job file contains a block with that name.

## Demo recording

`demo.tape` is a [VHS](https://github.com/charmbracelet/vhs) script that runs `ardoise` and
writes `demo.gif`. Re-record with:

```sh
vhs demo.tape
```

## Conventions

The interface is French — labels, prompts, and generated document text are hardcoded in
French, because the paperwork it produces is French. Keep code identifiers in English and
user-visible strings in French, as the existing files do.
