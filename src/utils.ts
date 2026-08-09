import { existsSync, unlinkSync } from "node:fs";
import { spawnSync } from "bun";
import { basename } from "node:path";
import * as ui from "./ui";

export async function loadYaml(file: string) {
  if (!existsSync(file)) return null;
  try {
    const content = await Bun.file(file).text();
    return Bun.YAML.parse(content);
  } catch {
    return null;
  }
}

export function compileTypst(file: string): boolean {
  const result = spawnSync({ cmd: ["typst", "compile", file] });

  if (result.success) {
    ui.success(`${basename(file.replace(".typ", ".pdf"))}`);
    try {
      unlinkSync(file);
    } catch {}
    return true;
  }

  ui.error(`typst failed to compile ${basename(file)}`);
  if (result.stderr) process.stderr.write(result.stderr.toString());
  return false;
}
