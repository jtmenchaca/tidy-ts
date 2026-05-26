// Property — typed input/output of a Node or Topology.
// Mirrors Oracle Open Agent Spec's Property shape (JSON-Schema-backed).
// Source: docs/reference/agent-spec/repo/tsagentspec/src/property.ts

import { z } from "zod";

export type JsonSchemaValue = Record<string, unknown>;

const INVALID_TITLE_CHARS = ".,{} \n'\"";

function validateTitle(title: string): string {
  if (title.length === 0) throw new Error("Property title cannot be empty");
  for (const c of INVALID_TITLE_CHARS) {
    if (title.includes(c)) {
      throw new Error(
        `Property title must not contain special characters or whitespace. Found: '${title}'`,
      );
    }
  }
  return title;
}

export const PropertySchema = z.object({
  jsonSchema: z.record(z.string(), z.unknown())
    .refine(
      (s) => typeof s.title === "string" && (s.title as string).length > 0,
      { message: "jsonSchema must contain a non-empty 'title' string" },
    )
    .refine(
      (s) => "type" in s || "anyOf" in s,
      { message: "jsonSchema must contain a 'type' or 'anyOf' field" },
    ),
  title: z.string().min(1),
  description: z.string().optional(),
  default: z.unknown().optional(),
  type: z.union([z.string(), z.array(z.string())]).optional(),
});

export type Property = z.infer<typeof PropertySchema>;

function makeProperty(
  jsonSchema: JsonSchemaValue,
  title: string,
  description?: string,
  defaultValue?: unknown,
): Property {
  validateTitle(title);
  return Object.freeze({
    jsonSchema,
    title,
    description,
    default: defaultValue,
    type: jsonSchema.type as string | string[] | undefined,
  });
}

export function stringProperty(
  { title, description, default: dflt }: {
    title: string;
    description?: string;
    default?: string;
  },
): Property {
  return makeProperty(
    { title, ...(description ? { description } : {}), ...(dflt !== undefined ? { default: dflt } : {}), type: "string" },
    title,
    description,
    dflt,
  );
}

export function numberProperty(
  { title, description, default: dflt }: {
    title: string;
    description?: string;
    default?: number;
  },
): Property {
  return makeProperty(
    { title, ...(description ? { description } : {}), ...(dflt !== undefined ? { default: dflt } : {}), type: "number" },
    title,
    description,
    dflt,
  );
}

export function booleanProperty(
  { title, description, default: dflt }: {
    title: string;
    description?: string;
    default?: boolean;
  },
): Property {
  return makeProperty(
    { title, ...(description ? { description } : {}), ...(dflt !== undefined ? { default: dflt } : {}), type: "boolean" },
    title,
    description,
    dflt,
  );
}

export function objectProperty(
  { title, description, properties }: {
    title: string;
    description?: string;
    properties: Record<string, Property>;
  },
): Property {
  const props: Record<string, JsonSchemaValue> = {};
  for (const [k, v] of Object.entries(properties)) props[k] = v.jsonSchema;
  return makeProperty(
    { title, ...(description ? { description } : {}), type: "object", properties: props },
    title,
    description,
  );
}

export function listProperty(
  { title, description, itemType, default: dflt }: {
    title: string;
    description?: string;
    itemType: Property;
    default?: unknown[];
  },
): Property {
  return makeProperty(
    { title, ...(description ? { description } : {}), ...(dflt !== undefined ? { default: dflt } : {}), type: "array", items: itemType.jsonSchema },
    title,
    description,
    dflt,
  );
}

export function findPropertyByTitle(
  properties: Property[] | undefined,
  title: string,
): Property | undefined {
  return properties?.find((p) => p.title === title);
}
