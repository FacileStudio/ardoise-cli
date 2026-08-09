import { parseArgs } from "node:util";
import { existsSync, mkdirSync } from "node:fs";
import { join, basename, dirname } from "node:path";
import { templates } from "./templates";
import { DOC_CONFIG, type DocType } from "./config";
import { loadYaml, compileTypst } from "./utils";
import { mapVariables, injectVariables } from "./processor";
import { VERSION } from "./version";
import * as ui from "./ui";

const HELP = `Generate freelance documents from a YAML job file.

Usage:
  ardoise [options]

Options:
  -f, --file <path>   Path to a YAML job file (default: ./job.yml)
  -o, --out <dir>     Output directory for generated files
      --no-color      Disable colored output
  -h, --help          Show this help
  -V, --version       Show version

Environment:
  NO_COLOR            Disable colored output
`;

const USAGE_ERROR = 2;

function parse() {
  return parseArgs({
    args: Bun.argv.slice(2),
    options: {
      help: { type: "boolean", short: "h" },
      version: { type: "boolean", short: "V" },
      "no-color": { type: "boolean" },
      file: { type: "string", short: "f" },
      out: { type: "string", short: "o" },
    },
    strict: true,
  }).values;
}

async function main(): Promise<number> {
  let values: ReturnType<typeof parse>;
  try {
    values = parse();
  } catch (e) {
    ui.error(
      `${e instanceof Error ? e.message.toLowerCase() : String(e)} — run \`ardoise --help\``,
    );
    return USAGE_ERROR;
  }

  if (values.help) {
    console.log(HELP);
    return 0;
  }
  if (values.version) {
    console.log(`ardoise ${VERSION}`);
    return 0;
  }
  if (values["no-color"]) ui.disableColor();

  const configPath = values.file || (existsSync("./job.yml") ? "./job.yml" : null);
  if (!configPath) {
    ui.error("no job file found — create ./job.yml or pass --file <path>");
    return 1;
  }

  const config = await loadYaml(configPath);
  if (!config) {
    ui.error(`cannot parse ${configPath} — check that it is valid YAML`);
    return 1;
  }

  ui.step(`Reading ${basename(configPath)}`);

  let generated = 0;
  let failed = 0;

  for (const type of Object.keys(DOC_CONFIG) as DocType[]) {
    if (!config[type]) continue;

    const content = (templates as any)[type];
    if (!content) continue;

    const docData = typeof config[type] === "object" ? config[type] : {};
    const variables = mapVariables(type, config, docData);
    const finalContent = injectVariables(content, variables);

    const clientName = (config.client?.name || "Client").replace(/[^a-z0-9]/gi, "_");
    const outName = docData.output_name || `${DOC_CONFIG[type].prefix}_${clientName}`;
    const finalPath = values.out ? join(values.out, `${outName}.typ`) : `${outName}.typ`;

    const dir = dirname(finalPath);
    if (dir !== "." && !existsSync(dir)) mkdirSync(dir, { recursive: true });

    await Bun.write(finalPath, finalContent);
    if (compileTypst(finalPath)) generated++;
    else failed++;
  }

  if (failed > 0) {
    ui.error(`${generated} document(s) generated, ${failed} failed`);
    return 1;
  }
  if (generated === 0) {
    ui.step("No documents to generate");
    return 0;
  }
  ui.success(`${generated} document(s) generated`);
  return 0;
}

main()
  .then((code) => process.exit(code))
  .catch((e) => {
    ui.error(e instanceof Error ? e.message : String(e));
    process.exit(1);
  });
