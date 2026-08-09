let forcedOff = false;

export function disableColor(): void {
  forcedOff = true;
}

function paint(isTTY: boolean, code: string, text: string): string {
  if (forcedOff || !isTTY || process.env.NO_COLOR !== undefined) return text;
  return `\x1b[${code}m${text}\x1b[0m`;
}

const outTTY = () => Boolean(process.stdout.isTTY);
const errTTY = () => Boolean(process.stderr.isTTY);

export const step = (msg: string): void =>
  console.log(`${paint(outTTY(), "36", "▸")} ${msg}`);

export const success = (msg: string): void =>
  console.log(`${paint(outTTY(), "32", "✓")} ${msg}`);

export const warn = (msg: string): void =>
  console.error(`${paint(errTTY(), "33", "!")} ${msg}`);

export const error = (msg: string): void =>
  console.error(`${paint(errTTY(), "31", "✗")} ${msg}`);

export const hint = (msg: string): void =>
  console.log(`  ${paint(outTTY(), "2", msg)}`);

export const dim = (text: string): string => paint(outTTY(), "2", text);
