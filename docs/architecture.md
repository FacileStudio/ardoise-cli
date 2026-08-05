# ardoise-cli — Architecture

What happens between `ardoise` and a finished PDF, and the contract between the job file,
the variable mapper, and the Typst templates.

## Runtime topology

```
job.yml ──▶ ardoise (Bun binary)
              │
              ├─ Bun.YAML.parse            job file to a plain object
              │
              └─ for each document block present in the YAML:
                   │
                   ├─ templates[type]      Typst source, a TypeScript string
                   ├─ mapVariables()       YAML shape ──▶ flat variable table
                   ├─ injectVariables()    {{tag}} substitution
                   ├─ Bun.write()          <out>/<name>.typ
                   │
                   └─ Bun.spawnSync(["typst", "compile", file])
                          │
                          ├─ success ──▶ <out>/<name>.pdf, the .typ is deleted
                          └─ failure ──▶ the .typ stays on disk, stderr is printed
```

No server, no database, no network. The only external process is `typst`.

## Components

| File | Responsibility |
|---|---|
| `src/index.ts` | Parses arguments, loads the job file, drives the loop, decides output paths |
| `src/config.ts` | `DOC_CONFIG` — the registry of document types, their labels and filename prefixes |
| `src/processor.ts` | `mapVariables`, `injectVariables`, and the Typst item-array formatter |
| `src/utils.ts` | `loadYaml` and `compileTypst` |
| `src/templates/*.ts` | The Typst source of each document, exported as a template string |

## Document registry

`DOC_CONFIG` is the whole notion of "document type". A key is a document type if and only if
it appears here **and** a template of the same name is exported from `src/templates/`.

| Key | Label | Filename prefix |
|---|---|---|
| `prestation` | Facture Prestation | `Facture_Presta` |
| `maintenance` | Devis Maintenance | `Devis_Maint` |
| `contrat_prestation` | Contrat Prestation | `Contrat_Presta` |
| `contrat_maintenance` | Contrat Maintenance | `Contrat_Maint` |

The generation loop walks these keys in order and skips any that the job file does not
define, which is how a job file selects what to emit. A key with no matching template is
skipped silently.

## Variable mapping

`mapVariables(type, config, docData)` flattens three sources into one table, later sources
winning over earlier ones:

1. the whole job file
2. the `prestataire` block
3. the document's own block

It then adds derived keys, which are written **after** the spreads and therefore override
any same-named key from the YAML:

| Variable | Source |
|---|---|
| `items` | The block's `items`, formatted as a Typst array of dictionaries |
| `invoice_number`, `quote_number`, `contract_reference` | The block's `number`, falling back to a top-level `number`, then to `SANS-NUMERO` / `REF-CONTRAT` |
| `invoice_date`, `quote_date`, `contract_date` | The block's `date`, then a top-level `date` |
| `due_date` | The block's `due`, then its `validity_date`, then a top-level `due` |

Finally every key of `prestataire` is republished as `provider_<key>` and every key of
`client` as `client_<key>`. That is where `provider_name`, `client_city` and friends come
from.

The override rule has one visible consequence: a `quote_number` written inside
`contrat_prestation` is ignored, because the derived `quote_number` computed from that
block's own `number` is applied afterwards.

## Item formatting

`formatTypstItems` turns each entry of `items` into Typst syntax:

```typst
(description: "Développement", quantity: 5, unit: "jours", price: 650),
```

`price` and `quantity` go through `parseFloat`, defaulting to `0` and `1` respectively, so a
malformed number degrades instead of producing invalid Typst. `unit` defaults to `u`. The
whole list is joined with commas and gets a trailing comma, which is what the templates
expect when they interpolate `{{items}}` into an array literal.

## Injection

`injectVariables` scans the template for `{{name}}` where `name` matches
`[a-zA-Z0-9_]+`, and replaces every occurrence:

- known variable: its value, stringified
- unknown variable whose name contains `rate`, `price`, `amount`, `estimate` or `qty`:
  `0.00`, so arithmetic in the template still compiles
- any other unknown variable: the empty string

Nothing fails on a missing variable. A typo in a template placeholder produces a blank in
the PDF rather than an error, which is the main thing to watch for when editing templates.

## Templates

Templates are Typst source held as TypeScript template strings, not `.typ` files. They live
in `src/templates/` and are re-exported from `src/templates/index.ts` under the same keys as
`DOC_CONFIG`. Keeping them in the module means `bun build --compile` ships them inside the
binary, with no asset path to resolve at runtime.

## Output naming

For each generated document the name is:

- `output_name` from the document block, if present
- otherwise `<prefix>_<client name>`, where the client name has every character outside
  `[a-z0-9]` (case-insensitive) replaced by `_`, and defaults to `Client` when the job file
  has no `client.name`

The file is written to `--out` if given, otherwise to the current working directory. A
missing output directory is created recursively.

## Failure behavior

The tool is quiet about bad input: a missing job file, or one that fails to parse, exits
with status 1 and no message. A Typst compilation failure prints Typst's own stderr, leaves
the `.typ` in place for inspection, and lets the loop continue to the next document.
