/**
 * Generic CSV to XES Converter
 * Converts CSV event logs to XES format with configurable mappings
 */

import { readCSV } from "@tidy-ts/dataframe";
import type { z } from "zod";

/**
 * Attribute type specification for XES output
 */
export type XESAttributeType = "string" | "int" | "float" | "date" | "boolean";

/**
 * Mapping configuration for attributes
 */
export interface AttributeMapping {
  csvColumn: string;
  xesKey: string;
  xesType: XESAttributeType;
  required?: boolean;
}

/**
 * Configuration for CSV to XES conversion
 */
export interface CSVtoXESConfig {
  // File paths
  inputPath: string;
  outputPath: string;

  // Required column mappings
  caseIdColumn: string; // Column identifying the case/trace
  activityColumn: string; // Column identifying the activity name
  timestampColumn: string; // Column with timestamps

  // Zod schema for CSV validation
  schema: z.ZodObject<Record<string, z.ZodTypeAny>>;

  // Optional attribute mappings
  traceAttributes?: AttributeMapping[]; // Case-level attributes
  eventAttributes?: AttributeMapping[]; // Event-level attributes

  // XES metadata
  logAttributes?: Record<string, string>;
}

/**
 * Escape special XML characters for safe output
 */
function xmlEscape(s: string): string {
  return s
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

/**
 * Format a value as an XES attribute based on type
 */
function formatXESAttribute(
  key: string,
  value: unknown,
  type: XESAttributeType,
): string {
  if (value === null || value === undefined) return "";

  const indent = "\t\t\t";

  switch (type) {
    case "string":
      return `${indent}<string key="${key}" value="${
        xmlEscape(String(value))
      }" />\n`;
    case "int":
      return `${indent}<int key="${key}" value="${
        Math.floor(Number(value))
      }" />\n`;
    case "float":
      return `${indent}<float key="${key}" value="${Number(value)}" />\n`;
    case "date": {
      const iso = value instanceof Date
        ? value.toISOString()
        : new Date(String(value)).toISOString();
      return `${indent}<date key="${key}" value="${iso}" />\n`;
    }
    case "boolean":
      return `${indent}<boolean key="${key}" value="${Boolean(value)}" />\n`;
    default:
      return "";
  }
}

/**
 * Convert CSV event log to XES format
 */
export async function convertCSVtoXES(config: CSVtoXESConfig): Promise<void> {
  console.log(`Loading CSV file: ${config.inputPath}`);
  const df = await readCSV(config.inputPath, config.schema);

  console.log(`Loaded ${df.nrows()} events`);
  console.log("Converting to XES format...");

  // Extract unique case IDs
  const caseIds = df.extractUnique(config.caseIdColumn);
  console.log(`Found ${caseIds.length} unique cases (traces)`);

  // Build XES XML header
  let xes = `<?xml version="1.0" encoding="utf-8" ?>
<log xes.version="1849-2016" xes.features="nested-attributes" xmlns="http://www.xes-standard.org/">
\t<extension name="Concept" prefix="concept" uri="http://www.xes-standard.org/concept.xesext" />
\t<extension name="Time" prefix="time" uri="http://www.xes-standard.org/time.xesext" />
`;

  // Add log-level attributes
  if (config.logAttributes) {
    for (const [key, value] of Object.entries(config.logAttributes)) {
      xes += `\t<string key="${key}" value="${xmlEscape(value)}" />\n`;
    }
  }

  // Process each case/trace
  for (const caseId of caseIds) {
    const caseEvents = df.filter((row: Record<string, unknown>) =>
      row[config.caseIdColumn] === caseId
    );

    xes += `\t<trace>\n`;
    xes += `\t\t<string key="concept:name" value="${caseId}" />\n`;

    // Add trace-level attributes from first event
    if (config.traceAttributes && config.traceAttributes.length > 0) {
      const firstEvent = caseEvents.sliceHead(1);
      for (const attr of config.traceAttributes) {
        const value = firstEvent.extractHead(attr.csvColumn, 1);
        if (value !== undefined || attr.required) {
          const attrXML = formatXESAttribute(attr.xesKey, value, attr.xesType);
          if (attrXML) xes += `\t${attrXML}`;
        }
      }
    }

    // Collect and sort events by timestamp
    const rows: { idx: number; iso?: string }[] = [];
    for (let i = 0; i < caseEvents.nrows(); i++) {
      const rawTs = caseEvents.slice(i, i + 1).extractHead(
        config.timestampColumn,
        1,
      );
      const iso = rawTs ? new Date(String(rawTs)).toISOString() : undefined;
      rows.push({ idx: i, iso });
    }
    rows.sort((a, b) => {
      const at = a.iso ? Date.parse(a.iso) : Number.POSITIVE_INFINITY;
      const bt = b.iso ? Date.parse(b.iso) : Number.POSITIVE_INFINITY;
      return at - bt;
    });

    // Write events in sorted order
    for (const { idx, iso } of rows) {
      const row = caseEvents.slice(idx, idx + 1);

      xes += `\t\t<event>\n`;

      // Add standard XES concept:name (activity)
      const activity = row.extractHead(config.activityColumn, 1);
      if (activity) {
        const safeAct = xmlEscape(String(activity));
        xes += `\t\t\t<string key="concept:name" value="${safeAct}" />\n`;
      }

      // Add timestamp
      if (iso) {
        xes += `\t\t\t<date key="time:timestamp" value="${iso}" />\n`;
      }

      // Add event-level attributes
      if (config.eventAttributes && config.eventAttributes.length > 0) {
        for (const attr of config.eventAttributes) {
          const value = row.extractHead(attr.csvColumn, 1);
          if (value !== undefined || attr.required) {
            const attrXML = formatXESAttribute(
              attr.xesKey,
              value,
              attr.xesType,
            );
            if (attrXML) xes += attrXML;
          }
        }
      }

      // Add original index for reference
      xes += `\t\t\t<int key="@@index" value="${idx}" />\n`;
      xes += `\t\t</event>\n`;
    }

    xes += `\t</trace>\n`;
  }

  xes += `</log>\n`;

  // Write to file
  console.log(`Writing XES file: ${config.outputPath}`);
  await Deno.writeTextFile(config.outputPath, xes);
  console.log(`Done! Created: ${config.outputPath}`);
}
