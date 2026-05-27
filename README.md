# 🦉 Ardoise Document Generator

This project provides an interactive script to generate various Typst documents (quotes, maintenance contracts).

## Setup

1.  **Install Bun**: If you don't have Bun installed, follow the instructions on their official website: [https://bun.sh](https://bun.sh)
2.  **Install Typst**: Make sure Typst is installed and available in your PATH. Refer to the Typst documentation for installation instructions.

## Usage

1.  **Run the generator**:
    ```bash
    bun run start
    ```
    or, since `index.ts` is executable:
    ```bash
    ./index.ts
    ```

2.  **Follow the prompts**: The script will interactively ask you for client details, product/service information, and which documents you want to generate.

3.  **Generated Files**: The generated `.typ` files and their compiled `.pdf` versions will be created in the root directory of this project, named like `generated-devis-prestation-<client_name>.typ` and `generated-devis-prestation-<client_name>.pdf`.

## Demo

![demo](demo.gif)


## Job Configuration (`job.yml`)

The `job.yml` file serves as a central configuration for defining all the dynamic data used in document generation. It allows you to pre-fill details for service providers, clients, service prestations, maintenance contracts, and general contract information.

### Structure of `job.yml`

```yml
prestataire:
  name: "Jean Codeur EURL"
  legal_form: "EURL au capital de 1000€"
  address: "42 Rue de l'Innovation"
  city: "75001 Paris"
  country: "France"
  siret: "123 456 789 00012"
  email: "contact@jeancodeur.fr"
  phone: "06 01 02 03 04"
  bank_name: "Banque Digitale"
  iban: "FR76 1234 5678 9012 3456 7890 123"
  bic: "BDIGFRXX"
  tva_rate: 20

client:
  name: "SpaceX Exploration Technologies"
  address: "Rocket Road"
  city: "Hawthorne, CA 90250"
  country: "USA"
  siret: "0"

prestation:
  number: "FACT-2026-001"
  date: "05/02/2026"
  due: "05/03/2026"
  items:
    - description: "Développement Module IA"
      quantity: 5
      unit: "jours"
      price: 650
    - description: "Architecture Cloud"
      quantity: 2
      unit: "jours"
      price: 800

maintenance:
  number: "DEVIS-MAINT-2026-001"
  date: "10/02/2026"
  validity_date: "10/03/2026"
  maintenance_period: "Février 2026"
  railway_estimate: 150.00
  items:
    - description: "Forfait Maintenance Mensuel"
      quantity: 1
      unit: "mois"
      price: 450

contrat_prestation:
  number: "CONT-PRESTA-SPX-01"
  date: "05/02/2026"
  quote_number: "FACT-2026-001"
  output_name: "Contrat_Projet_SpaceX"

contrat_maintenance:
  number: "CONT-MAINT-SPX-01"
  date: "15/02/2026"
  output_name: "Contrat_Maintenance_SpaceX"
  ```

By modifying this file, you can quickly generate documents with consistent and pre-defined information without needing to interactively input all details each time.
