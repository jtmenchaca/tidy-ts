// CSV parsing utilities - lightweight CSV parser without external dependencies
export interface CSVOptions {
  comma?: string; // default: ","
  quote?: string; // default: "\""
  skipEmptyLines?: boolean; // default: false
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
