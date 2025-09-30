import {
  computeColumns,
  isNumericColumn,
} from "../implementation/column-helpers.ts";

import type { PrintOptions } from "../implementation/create-dataframe.ts";

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
  if (v instanceof Date) {
    return v.toISOString();
  }
  try {
    return JSON.stringify(v);
  } catch {
    return String(v);
  }
}

/** Build toMarkdown printer bound to the specific store instance */
export function buildToMarkdown(store: readonly object[]) {
  return (opts: PrintOptions = {}): string => {
    const {
      maxRows = 20,
      maxColWidth = 24,
      includeRowIndex = true,
    } = opts;

    const cols = computeColumns(store);
    const n = store.length;

    if (n === 0) {
      const header = includeRowIndex
        ? "| # | (empty) |\n|:--|:--------|\n"
        : "| (empty) |\n|:--------|\n";
      return header;
    }

    const alignRight: boolean[] = cols.map((c) => isNumericColumn(store, c));

    const headers = includeRowIndex ? ["#"].concat(cols) : cols.slice();
    const widths = headers.map((h) =>
      Math.min(maxColWidth, Math.max(h.length, 1))
    );

    const limit = Math.min(maxRows, n);
    for (let i = 0; i < limit; i++) {
      const row = store[i] ?? {};
      const cells: string[] = [];
      if (includeRowIndex) cells.push(String(i));
      // deno-lint-ignore no-explicit-any
      for (const c of cols) cells.push(stringifyCell((row as any)[c]));
      cells.forEach((s, j) => {
        const w = Math.min(maxColWidth, Math.max(s.length, 1));
        if (w > widths[j]) widths[j] = w;
      });
    }

    const pad = (s: string, w: number, rightAlign: boolean) => {
      const clipped = clip(s, w);
      if (rightAlign) return clipped.padStart(w, " ");
      return clipped.padEnd(w, " ");
    };

    const headerRow = headers
      .map((h, j) =>
        pad(
          h,
          widths[j],
          includeRowIndex && j === 0
            ? true
            : alignRight[j - (includeRowIndex ? 1 : 0)] ?? false,
        )
      )
      .join(" | ");

    const sepRow = headers
      .map((_h, j) => {
        const right = includeRowIndex && j === 0
          ? true
          : alignRight[j - (includeRowIndex ? 1 : 0)] ?? false;
        const w = widths[j];
        if (right) return "-".repeat(Math.max(1, w - 1)) + ":";
        return ":" + "-".repeat(Math.max(1, w - 1));
      })
      .join(" | ");

    const bodyLines: string[] = [];
    for (let i = 0; i < limit; i++) {
      const row = store[i] ?? {};
      const parts: string[] = [];
      if (includeRowIndex) parts.push(pad(String(i), widths[0], true));
      for (let cIdx = 0; cIdx < cols.length; cIdx++) {
        const c = cols[cIdx];
        // deno-lint-ignore no-explicit-any
        const cell = stringifyCell((row as any)[c]);
        const w = widths[cIdx + (includeRowIndex ? 1 : 0)];
        parts.push(pad(cell, w, alignRight[cIdx]));
      }
      bodyLines.push(parts.join(" | "));
    }

    const more = n > limit ? `\n… and ${n - limit} more rows` : "";
    return `| ${headerRow} |\n| ${sepRow} |\n${
      bodyLines.map((l) => `| ${l} |`).join("\n")
    }${more}`;
  };
}
