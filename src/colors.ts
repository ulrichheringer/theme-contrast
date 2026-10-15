export interface ColorToken {
  name: string;
  value: string;
}

export interface ParsedColor {
  red: number;
  green: number;
  blue: number;
}

export type TokenChange = { name: string; kind: "added" | "removed" | "changed"; before?: string; after?: string };

export function parseColor(value: string): ParsedColor | null {
  const input = value.trim().toLowerCase();
  const hex = input.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i)?.[1];
  if (hex) {
    const digits = hex.length === 3 ? hex.split("").map((digit) => digit + digit).join("") : hex;
    return {
      red: Number.parseInt(digits.slice(0, 2), 16),
      green: Number.parseInt(digits.slice(2, 4), 16),
      blue: Number.parseInt(digits.slice(4, 6), 16),
    };
  }
  const rgb = input.match(/^rgba?\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})(?:\s*,\s*(1(?:\.0+)?|0(?:\.\d+)?))?\s*\)$/);
  if (!rgb || (rgb[4] !== undefined && Number(rgb[4]) !== 1)) return null;
  const channels = rgb.slice(1, 4).map(Number);
  if (channels.some((channel) => channel < 0 || channel > 255)) return null;
  return { red: channels[0], green: channels[1], blue: channels[2] };
}

export function luminance(color: ParsedColor): number {
  const linear = [color.red, color.green, color.blue].map((channel) => {
    const srgb = channel / 255;
    return srgb <= 0.04045 ? srgb / 12.92 : Math.pow((srgb + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * linear[0] + 0.7152 * linear[1] + 0.0722 * linear[2];
}

export function contrastRatio(foreground: string, background: string): number | null {
  const fg = parseColor(foreground);
  const bg = parseColor(background);
  if (!fg || !bg) return null;
  const values = [luminance(fg), luminance(bg)].sort((a, b) => b - a);
  return (values[0] + 0.05) / (values[1] + 0.05);
}

function isColorString(value: string): boolean {
  return parseColor(value) !== null;
}

export function parseTokens(source: string, format: "json" | "css"): ColorToken[] {
  if (format === "css") {
    const tokens: ColorToken[] = [];
    const expression = /--([\w-]+)\s*:\s*([^;}]+)/g;
    for (const match of source.matchAll(expression)) {
      const value = match[2].trim();
      if (isColorString(value)) tokens.push({ name: match[1], value });
    }
    return tokens.sort((a, b) => a.name.localeCompare(b.name));
  }
  const parsed: unknown = JSON.parse(source);
  const tokens: ColorToken[] = [];
  const walk = (value: unknown, path: string) => {
    if (typeof value === "string" && isColorString(value)) {
      tokens.push({ name: path || "color", value });
      return;
    }
    if (!value || typeof value !== "object" || Array.isArray(value)) return;
    const record = value as Record<string, unknown>;
    const colorValue = record.$value ?? record.value;
    if (typeof colorValue === "string" && isColorString(colorValue)) {
      tokens.push({ name: path || "color", value: colorValue });
      return;
    }
    Object.entries(record).forEach(([key, child]) => {
      if (key === "$type" || key === "type") return;
      walk(child, path ? path + "." + key : key);
    });
  };
  walk(parsed, "");
  return tokens.sort((a, b) => a.name.localeCompare(b.name));
}

export function compareTokens(before: ColorToken[], after: ColorToken[]): TokenChange[] {
  const left = new Map(before.map((token) => [token.name, token.value.toLowerCase()]));
  const right = new Map(after.map((token) => [token.name, token.value.toLowerCase()]));
  const names = new Set([...left.keys(), ...right.keys()]);
  const changes: TokenChange[] = [];
  [...names].sort().forEach((name) => {
    const beforeValue = left.get(name);
    const afterValue = right.get(name);
    if (beforeValue === undefined) changes.push({ name, kind: "added", after: afterValue });
    else if (afterValue === undefined) changes.push({ name, kind: "removed", before: beforeValue });
    else if (beforeValue !== afterValue) changes.push({ name, kind: "changed", before: beforeValue, after: afterValue });
  });
  return changes;
}

