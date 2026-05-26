// Derive OAS Property[] from a Zod object schema via z.toJSONSchema.
// Used by createStartNode / createAgent / createEndNode to avoid making
// authors declare the schema twice — once as Zod (runtime) and once as
// OAS Properties (graph metadata).

import { z } from "zod";
import type { JsonSchemaValue, Property } from "./property.ts";

function makePropertyFromJsonSchema(
  title: string,
  jsonSchema: JsonSchemaValue,
): Property {
  const merged: JsonSchemaValue = { ...jsonSchema, title };
  // Ensure the schema satisfies PropertySchema's invariants (type or anyOf).
  if (!("type" in merged) && !("anyOf" in merged)) {
    merged.type = "object";
  }
  return Object.freeze({
    jsonSchema: merged,
    title,
    description: jsonSchema.description as string | undefined,
    default: jsonSchema.default,
    type: jsonSchema.type as string | string[] | undefined,
  });
}

/**
 * Convert a Zod object schema into one Property per top-level field.
 *
 * If `schema` is not a ZodObject, returns a single Property wrapping the
 * schema under the fallback title.
 */
export function zodObjectToProperties(
  schema: z.ZodType,
  fallbackTitle = "value",
): Property[] {
  const json = z.toJSONSchema(schema) as JsonSchemaValue;

  if (
    json.type === "object" &&
    json.properties &&
    typeof json.properties === "object"
  ) {
    const props = json.properties as Record<string, JsonSchemaValue>;
    return Object.entries(props).map(([key, value]) =>
      makePropertyFromJsonSchema(key, value)
    );
  }

  return [makePropertyFromJsonSchema(fallbackTitle, json)];
}
