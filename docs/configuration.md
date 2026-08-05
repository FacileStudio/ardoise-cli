# ardoise-cli — Configuration

The job file is the entire configuration surface. Every key below is one the code or a
template actually reads.

## Environment variables

None. The source contains no `process.env` or `Bun.env` access. Behavior is controlled by
the job file and the two command flags documented in [usage.md](usage.md).

## The job file

| Path | `./job.yml` by default, or whatever `-f, --file` points at |
|---|---|
| Format | YAML, parsed with `Bun.YAML.parse` |
| Required | Yes — with no `-f` and no `./job.yml` in the current directory, the command exits 1 without a message |

The repo ships a complete example at `job.yml`, filled with fictional data. Copy it per
client rather than starting from scratch.

## `prestataire` — you

Every key here is republished to templates as `provider_<key>`, and the block is also
spread flat, which is how `iban`, `bic`, `bank_name` and `tva_rate` reach the templates
under their bare names. Extra keys are harmless.

| Key | Used as | Appears in |
|---|---|---|
| `name` | `provider_name` | All four documents |
| `address` | `provider_address` | All four |
| `city` | `provider_city` | All four |
| `siret` | `provider_siret` | All four |
| `email` | `provider_email` | All four |
| `phone` | `provider_phone` | Invoice, maintenance quote |
| `bank_name` | `bank_name` | Invoice, maintenance quote |
| `iban` | `iban` | Invoice, maintenance quote |
| `bic` | `bic` | Invoice, maintenance quote |
| `tva_rate` | `tva_rate` | Invoice, maintenance quote |
| `country` | `provider_country` | Not referenced by any template today |

Both contract templates reference `{{provider_legal}}`, which the mapper only produces from
a `prestataire.legal` key. The example file spells it `legal_form`, which maps to
`provider_legal_form` and leaves `{{provider_legal}}` blank. Add a `legal:` key to
`prestataire` if you want that line filled in.

## `client` — the billed party

Every key is republished as `client_<key>`.

| Key | Used as | Notes |
|---|---|---|
| `name` | `client_name` | Also drives the output filename; defaults to `Client` if absent |
| `address` | `client_address` | |
| `city` | `client_city` | |
| `country` | `client_country` | |
| `siret` | `client_siret` | |

## Document blocks

A block's presence is what makes the corresponding document get generated. All four accept
`output_name` to override the generated filename.

### `prestation` — service invoice

| Key | Template variable | Notes |
|---|---|---|
| `number` | `invoice_number` | Falls back to `SANS-NUMERO` |
| `date` | `invoice_date` | |
| `due` | `due_date` | |
| `items` | `items` | List of `description`, `quantity`, `unit`, `price` |
| `output_name` | — | Overrides the `Facture_Presta_<client>` default |

### `maintenance` — maintenance quote

| Key | Template variable | Notes |
|---|---|---|
| `number` | `quote_number` | Falls back to `SANS-NUMERO` |
| `date` | `quote_date` | |
| `validity_date` | `validity_date`, and `due_date` when `due` is absent | |
| `maintenance_period` | `maintenance_period` | Free text, for example `Février 2026` |
| `railway_estimate` | `railway_estimate` | Numeric; renders `0.00` if missing |
| `items` | `items` | Same shape as the invoice |
| `output_name` | — | Overrides `Devis_Maint_<client>` |

### `contrat_prestation` — service contract

| Key | Template variable | Notes |
|---|---|---|
| `number` | `contract_reference` and `quote_number` | Falls back to `REF-CONTRAT` |
| `date` | `contract_date` | |
| `output_name` | — | Overrides `Contrat_Presta_<client>` |

A `quote_number` key written in this block is overridden by the value derived from
`number`; see [architecture.md](architecture.md).

### `contrat_maintenance` — maintenance contract

| Key | Template variable | Notes |
|---|---|---|
| `number` | `contract_reference` | Falls back to `REF-CONTRAT` |
| `date` | `contract_date` | |
| `output_name` | — | Overrides `Contrat_Maint_<client>` |

## Item entries

```yaml
items:
  - description: "Développement Module IA"
    quantity: 5
    unit: "jours"
    price: 650
```

| Key | Required | Default | Notes |
|---|---|---|---|
| `description` | yes | — | Interpolated into Typst as a quoted string |
| `quantity` | no | `1` | Non-numeric values fall back to `1` |
| `unit` | no | `u` | |
| `price` | no | `0` | Non-numeric values fall back to `0` |

## Top-level fallbacks

`number`, `date`, `due` and `items` are also read from the top level of the job file when
the document block omits them. That lets several blocks share one date or one item list,
though putting them in each block is clearer.

## Missing values

No key is validated. An unknown or unset placeholder renders as an empty string, unless its
name contains `rate`, `price`, `amount`, `estimate` or `qty`, in which case it renders
`0.00`. Documents therefore always compile; check the PDF, not the exit code.
