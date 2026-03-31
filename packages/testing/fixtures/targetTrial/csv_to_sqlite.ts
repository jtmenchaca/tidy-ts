import { DatabaseSync } from "node:sqlite";
import { readFileSync, readdirSync, unlinkSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const dbPath = join(__dirname, "targetTrial.db");

// Remove existing db if present
if (existsSync(dbPath)) unlinkSync(dbPath);

const db = new DatabaseSync(dbPath);

const csvFiles = readdirSync(__dirname).filter((f) => f.endsWith(".csv"));

for (const csvFile of csvFiles) {
  const tableName = csvFile.replace(".csv", "").replaceAll("-", "_");
  const raw = readFileSync(join(__dirname, csvFile), "utf-8");
  const lines = raw.trim().split("\n");
  if (lines.length < 2) {
    console.log(`Skipping ${csvFile} (no data rows)`);
    continue;
  }

  const headers = parseCSVRow(lines[0]);
  const rows = lines.slice(1).map(parseCSVRow);

  // Infer column types from data
  const colTypes = headers.map((_, colIdx) => {
    let isNumeric = false;
    let hasDecimal = false;
    let isBool = false;
    for (const row of rows) {
      const val = row[colIdx];
      if (val === "NA" || val === "" || val === undefined) continue;
      if (val === "TRUE" || val === "FALSE") {
        isBool = true;
        continue;
      }
      if (!isNaN(Number(val))) {
        isNumeric = true;
        if (val.includes(".")) hasDecimal = true;
      } else {
        return "TEXT";
      }
    }
    if (isBool && !isNumeric) return "INTEGER";
    if (isNumeric) return hasDecimal ? "REAL" : "INTEGER";
    return "TEXT";
  });

  // Sanitize column names for SQLite
  const sanitized = headers.map((h) =>
    h.replace(/\./g, "_").replace(/[^a-zA-Z0-9_]/g, ""),
  );

  const createSQL =
    `CREATE TABLE "${tableName}" (${sanitized.map((h, i) => `"${h}" ${colTypes[i]}`).join(", ")})`;
  db.exec(createSQL);

  const placeholders = sanitized.map(() => "?").join(", ");
  const insert = db.prepare(
    `INSERT INTO "${tableName}" (${sanitized.map((h) => `"${h}"`).join(", ")}) VALUES (${placeholders})`,
  );

  db.exec("BEGIN TRANSACTION");
  for (const row of rows) {
    const values = row.map((val, i) => {
      if (val === "NA" || val === "") return null;
      if (colTypes[i] === "INTEGER") {
        if (val === "TRUE") return 1;
        if (val === "FALSE") return 0;
        return parseInt(val, 10);
      }
      if (colTypes[i] === "REAL") return parseFloat(val);
      return val;
    });
    insert.run(...values);
  }
  db.exec("COMMIT");

  console.log(`Created table "${tableName}" (${rows.length} rows)`);
}

db.close();
console.log(`\nDatabase: ${dbPath}`);

function parseCSVRow(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"') {
        if (line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        current += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ",") {
      result.push(current);
      current = "";
    } else {
      current += ch;
    }
  }
  result.push(current);
  return result;
}
