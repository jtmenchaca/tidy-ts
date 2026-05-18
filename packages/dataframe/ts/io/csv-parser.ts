// CSV parsing utilities - lightweight CSV parser without external dependencies
export interface CSVOptions {
  comma?: string; // default: ","
  quote?: string; // default: "\""
  skipEmptyLines?: boolean; // default: false
  /**
   * When true, repeated header names are renamed by suffixing _2, _3, etc.
   * (e.g. `["name", "value", "name", "value"]` → `["name", "value", "name_2", "value_2"]`).
   * The user's schema must address those suffixed names explicitly.
   *
   * When false (default), repeated header names throw with a clear message
   * pointing at the duplicate column indices and the suggested fix.
   */
  allowDuplicateHeaders?: boolean;
}

/**
 * Resolve a header row to unique names. Either throws on duplicates (default)
 * or renames them with `_2`, `_3`, ... suffixes when `allowDuplicates` is true.
 *
 * The thrown error names every duplicate, lists its column indices, and shows
 * the schema literal a user can copy if they opt in to the suffix scheme —
 * so the error itself teaches the opt-in path.
 *
 * @param headers - the raw header strings (already trimmed)
 * @param allowDuplicates - opt-in to silent rename
 * @param source - label for the error message ("CSV" or "XLSX")
 */
export function resolveHeaderNames(
  headers: string[],
  allowDuplicates: boolean,
  source: "CSV" | "XLSX",
): string[] {
  if (!allowDuplicates) {
    const indexByName = new Map<string, number[]>();
    headers.forEach((h, i) => {
      const list = indexByName.get(h);
      if (list) list.push(i);
      else indexByName.set(h, [i]);
    });
    const dupes = [...indexByName.entries()].filter(([, ix]) => ix.length > 1);
    if (dupes.length > 0) {
      const summary = dupes
        .map(([name, ix]) => `'${name}' at columns ${ix.join(", ")}`)
        .join("; ");
      const suffixed = deduplicateHeaders(headers);
      const suggested = suffixed.map((h) => `  ${h}: z.string(),`).join("\n");
      throw new Error(
        `read${source}: duplicate headers detected: ${summary}.\n\n` +
          `Two ways forward:\n` +
          `  • Rename one occurrence in the source ${source} file (recommended if you control it).\n` +
          `  • Pass \`allowDuplicateHeaders: true\` to read with suffixed names:\n` +
          `      ${suffixed.join(", ")}\n` +
          `    Then put the names you want in your schema, e.g.:\n` +
          `      z.object({\n${suggested}\n      })`,
      );
    }
    return headers;
  }
  return deduplicateHeaders(headers);
}

/**
 * Append `_2`, `_3`, ... to repeated header names.
 * e.g. ["name", "value", "name", "value"] → ["name", "value", "name_2", "value_2"]
 */
function deduplicateHeaders(headers: string[]): string[] {
  const counts = new Map<string, number>();
  return headers.map((h) => {
    const prev = counts.get(h) ?? 0;
    counts.set(h, prev + 1);
    if (prev === 0) return h;
    return `${h}_${prev + 1}`;
  });
}

/** Splits a CSV string into rows of cells without any 3rd-party libs */
export function parseCSV(
  input: string,
  {
    comma = ",",
    quote = '"',
    skipEmptyLines = false,
  }: CSVOptions = {},
): string[][] {
  const rows: string[][] = [];
  let cell = "";
  let row: string[] = [];
  let inQuotes = false;
  const q = quote;
  const c = comma;

  const pushCell = () => {
    row.push(cell);
    cell = "";
  };
  const pushRow = () => {
    if (!skipEmptyLines || row.some((v) => v.trim() !== "")) {
      rows.push(row);
    }
    row = [];
  };

  for (let i = 0; i < input.length; i++) {
    const ch = input[i];
    if (ch === q) {
      // If next char is another quote, it's an escaped quote
      if (inQuotes && input[i + 1] === q) {
        cell += q;
        i++; // skip the second quote
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (!inQuotes && ch === c) {
      pushCell();
      continue;
    }

    if (!inQuotes && (ch === "\n" || ch === "\r")) {
      // Handle CRLF – if CR followed by LF, skip the LF
      if (ch === "\r" && input[i + 1] === "\n") i++;
      pushCell();
      pushRow();
      continue;
    }

    cell += ch;
  }

  // Tail-end cell / row
  pushCell();
  pushRow();

  return rows;
}
