// src/dataframe/ts/utility/create-dataframe/stringify.ts

export function formatNumber(n: number): string {
  if (Number.isNaN(n)) return "NaN";
  if (n === Infinity) return "∞";
  if (n === -Infinity) return "-∞";
  return String(n);
}

export function clip(text: string, max: number): string {
  if (text.length <= max) return text;
  if (max <= 1) return "…";
  return text.slice(0, max - 1) + "…";
}

export function stringifyCell(v: unknown): string {
  if (v === null) return "null";
  if (v === undefined) return "";
  if (typeof v === "number") return formatNumber(v);
  if (typeof v === "string") {
    return v.replace(/\|/g, "\\|").replace(/\r?\n/g, "↵");
  }
  if (typeof v === "boolean") return v ? "true" : "false";
  try {
    return JSON.stringify(v);
  } catch {
    return String(v);
  }
}
