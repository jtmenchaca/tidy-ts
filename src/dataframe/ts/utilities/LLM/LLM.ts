// LLM utility with Zod schema validation and type inference
import { Agent, run, user, type AgentInputItem } from "@openai/agents";
import "@std/dotenv/load";
import { z, ZodDate, ZodDefault, ZodNullable, ZodOptional, type ZodTypeAny } from "zod";

/*───────────────────────────────────────────────────────────────────────────┐
│  0 · shared utils                                                          │
└───────────────────────────────────────────────────────────────────────────*/

/** Recursively unwrap .optional() / .nullable() / .default() wrappers */
const unwrap = (t: ZodTypeAny): {
  base: ZodTypeAny;
  optional: boolean;
  nullable: boolean;
  hasDefault: boolean;
} => {
  let base: ZodTypeAny = t;
  let optional = false;
  let nullable = false;
  let hasDefault = false;

  if (base instanceof ZodOptional) {
    optional = true;
    // deno-lint-ignore no-explicit-any
    base = (base as any)._def.innerType;
  }
  if (base instanceof ZodNullable) {
    nullable = true;
    // deno-lint-ignore no-explicit-any
    base = (base as any)._def.innerType;
  }
  if (base instanceof ZodDefault) {
    hasDefault = true;
    // deno-lint-ignore no-explicit-any
    base = (base as any)._def.innerType;
  }
  return { base, optional, nullable, hasDefault };
};

/*───────────────────────────────────────────────────────────────────────────┐
│  1 · schema conversion helpers                                            │
└───────────────────────────────────────────────────────────────────────────*/

/**
 * Automatically converts z.date() to z.iso.datetime() for OpenAI Agents API compatibility.
 *
 * The OpenAI Agents API requires date fields to be in ISO format (string), but we want users
 * to be able to use z.date() naturally. This function:
 * - Detects z.date() fields in the schema
 * - Converts them to z.iso.datetime() for the API call
 * - Tracks which fields need to be converted back to Date objects
 * - Preserves .optional(), .nullable(), and .default() modifiers
 */
// deno-lint-ignore no-explicit-any
function autoConvertSchema<T extends z.ZodObject<any>>(
  schema: T,
): { convertedSchema: T; dateFields: Set<string> } {
  // deno-lint-ignore no-explicit-any
  const convertedShape: Record<string, any> = {};
  const dateFields = new Set<string>();

  Object.entries(schema.shape).forEach(([key, value]) => {
    const unwrapped = unwrap(value as ZodTypeAny);

    // Check if the base type is ZodDate
    if (unwrapped.base instanceof ZodDate) {
      // Track that this field should be converted back to Date
      dateFields.add(key);

      // Convert z.date() to z.iso.datetime() (Date includes time, not just date)
      let converted: ZodTypeAny = z.iso.datetime();

      // Reapply the modifiers in the correct order
      if (unwrapped.optional) converted = converted.optional();
      if (unwrapped.nullable) converted = converted.nullable();
      if (unwrapped.hasDefault) {
        // deno-lint-ignore no-explicit-any
        converted = converted.default((unwrapped.base as any)._def.defaultValue());
      }

      convertedShape[key] = converted;
    } else {
      // Keep the original type
      convertedShape[key] = value;
    }
  });

  return {
    convertedSchema: z.object(convertedShape) as T,
    dateFields,
  };
}

/*───────────────────────────────────────────────────────────────────────────┐
│  2 · main LLM function                                                     │
└───────────────────────────────────────────────────────────────────────────*/

/**
 * Call an LLM with structured output using Zod schema validation and type inference.
 *
 * This function wraps the OpenAI Agents API to provide a simple interface for getting
 * structured responses from language models. It automatically handles:
 * - Type-safe schema validation using Zod
 * - Automatic conversion of z.date() fields to/from ISO datetime strings
 * - Full TypeScript type inference for the response
 *
 * @param userInput - The prompt/question to send to the LLM
 * @param schema - Zod schema defining the expected response structure
 * @param priorMessages - Optional conversation history for context
 * @param instructions - System instructions for the LLM (default: "You are a helpful assistant.")
 * @param model - OpenAI model to use (default: "gpt-4.1-mini")
 * @returns Typed response matching the Zod schema
 *
 * @example
 * ```ts
 * import { LLM } from "@tidy-ts/dataframe";
 * import { z } from "zod";
 *
 * // Simple string response (no schema)
 * const answer = await LLM({
 *   userInput: "What is the weather in Tokyo?",
 * });
 * console.log(answer); // Typed as string
 *
 * // Structured response with schema
 * const weather = await LLM({
 *   userInput: "What is the weather in Tokyo?",
 *   schema: z.object({
 *     weather: z.string(),
 *   }),
 * });
 * console.log(weather.weather); // Typed as string
 *
 * // Date fields are automatically converted
 * const event = await LLM({
 *   userInput: "When is the next solar eclipse?",
 *   schema: z.object({
 *     date: z.date(),
 *     location: z.string(),
 *   }),
 * });
 * console.log(event.date.getFullYear()); // Typed as Date object
 *
 * // With conversation context
 * const followUp = await LLM({
 *   userInput: "What about tomorrow?",
 *   priorMessages: [
 *     user("What is the weather today?"),
 *     // ... previous responses
 *   ],
 *   schema: z.object({ forecast: z.string() }),
 * });
 * ```
 */
// Overload: with schema
export async function LLM<T extends z.ZodObject>({
  userInput,
  priorMessages,
  instructions,
  model,
  schema,
}: {
  userInput: string;
  priorMessages?: AgentInputItem[];
  instructions?: string;
  model?: "gpt-4.1-mini" | "gpt-4.1" | "gpt-5-mini";
  schema: T;
}): Promise<z.infer<T>>;

// Overload: without schema (returns string)
export async function LLM({
  userInput,
  priorMessages,
  instructions,
  model,
}: {
  userInput: string;
  priorMessages?: AgentInputItem[];
  instructions?: string;
  model?: "gpt-4.1-mini" | "gpt-4.1" | "gpt-5-mini";
}): Promise<string>;

// Implementation
export async function LLM<T extends z.ZodObject>({
  userInput,
  priorMessages = [],
  instructions = "You are a helpful assistant.",
  model = "gpt-4.1-mini",
  schema,
}: {
  userInput: string;
  priorMessages?: AgentInputItem[];
  instructions?: string;
  model?: "gpt-4.1-mini" | "gpt-4.1" | "gpt-5-mini";
  schema?: T;
}): Promise<z.infer<T> | string> {
  // Convert z.date() to z.iso.date() if schema is provided
  const conversion = schema ? autoConvertSchema(schema) : undefined;

  const agent = conversion
    ? new Agent({
        name: "agent",
        model: model,
        instructions: instructions,
        outputType: conversion.convertedSchema,
      })
    : new Agent({
        name: "agent",
        model: model,
        instructions: instructions,
      });

  const result = await run(agent, [...priorMessages, user(userInput)]);
  const output = result.finalOutput as z.infer<T> | string;

  // Convert datetime strings back to Date objects for fields that were originally z.date()
  if (conversion && conversion.dateFields.size > 0 && typeof output === "object" && output !== null) {
    // deno-lint-ignore no-explicit-any
    const converted: any = { ...output };
    for (const field of conversion.dateFields) {
      const value = converted[field];
      if (typeof value === "string") {
        // Parse ISO datetime string to Date
        converted[field] = new Date(value);
      }
    }
    return converted as z.infer<T>;
  }

  return output as z.infer<T> | string;
}
