// LLM utility with Zod schema validation and type inference
import { Agent, type AgentInputItem, run, user } from "@openai/agents";
import { config } from "dotenv";
import OpenAI from "openai";
import {
  z,
  ZodDate,
  ZodDefault,
  ZodNullable,
  ZodOptional,
  type ZodTypeAny,
} from "zod";

// Load environment variables from .env file
config();

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
        converted = converted.default(
          // deno-lint-ignore no-explicit-any
          (unwrapped.base as any)._def.defaultValue(),
        );
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
│  2 · embeddings API types and function                                    │
└───────────────────────────────────────────────────────────────────────────*/

/** OpenAI embedding models */
export type EmbeddingModel =
  | "text-embedding-3-small"
  | "text-embedding-3-large"
  | "text-embedding-ada-002";

/**
 * Get vector embeddings for text using OpenAI's embeddings API.
 *
 * Embeddings are useful for:
 * - Search (ranking results by relevance)
 * - Clustering (grouping similar text)
 * - Recommendations (finding related items)
 * - Anomaly detection (identifying outliers)
 * - Classification (categorizing text)
 *
 * @param input - Text string or array of text strings to embed
 * @param model - Embedding model to use (default: "text-embedding-3-large")
 * @returns Embedding vector (number[]) for single string, or array of vectors (number[][]) for array input
 *
 * @example
 * ```ts
 * import { LLM } from "@tidy-ts/ai";
 *
 * // Single text - returns number[]
 * const embedding = await LLM.embed("Hello world");
 * console.log(embedding.length); // 3072 for text-embedding-3-large
 *
 * // Multiple texts - returns number[][]
 * const embeddings = await LLM.embed([
 *   "First document",
 *   "Second document"
 * ]);
 * console.log(embeddings.length); // 2
 * console.log(embeddings[0].length); // 3072
 *
 * // Use smaller model
 * const smallEmbedding = await LLM.embed(
 *   "Complex text",
 *   "text-embedding-3-small"
 * );
 * console.log(smallEmbedding.length); // 1536
 * ```
 */
// Overload: single string returns number[]
export async function getEmbeddings(
  input: string,
  model?: EmbeddingModel,
): Promise<number[]>;

// Overload: array of strings returns number[][]
export async function getEmbeddings(
  input: string[],
  model?: EmbeddingModel,
): Promise<number[][]>;

// Implementation
export async function getEmbeddings(
  input: string | string[],
  model: EmbeddingModel = "text-embedding-3-large",
): Promise<number[] | number[][]> {
  const openai = new OpenAI();

  const response = await openai.embeddings.create({
    model,
    input,
    encoding_format: "float",
  });

  // Sort by index to maintain input order, then extract embedding vectors
  const embeddings = response.data
    .sort((a, b) => a.index - b.index)
    .map((item) => item.embedding);

  // Return single embedding for string input, array for array input
  return typeof input === "string" ? embeddings[0] : embeddings;
}

/*───────────────────────────────────────────────────────────────────────────┐
│  3 · main LLM function                                                     │
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
 * import { LLM } from "@tidy-ts/ai";
 * import { z } from "zod";
 *
 * // Simple string response (no schema)
 * const answer = await LLM.respond({
 *   userInput: "What is the weather in Tokyo?",
 * });
 * console.log(answer); // Typed as string
 *
 * // Structured response with schema
 * const weather = await LLM.respond({
 *   userInput: "What is the weather in Tokyo?",
 *   schema: z.object({
 *     weather: z.string(),
 *   }),
 * });
 * console.log(weather.weather); // Typed as string
 *
 * // Date fields are automatically converted
 * const event = await LLM.respond({
 *   userInput: "When is the next solar eclipse?",
 *   schema: z.object({
 *     date: z.date(),
 *     location: z.string(),
 *   }),
 * });
 * console.log(event.date.getFullYear()); // Typed as Date object
 *
 * // With conversation context
 * const followUp = await LLM.respond({
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
async function respond<T extends z.ZodObject>({
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
async function respond({
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
async function respond<T extends z.ZodObject>({
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
  if (
    conversion && conversion.dateFields.size > 0 &&
    typeof output === "object" && output !== null
  ) {
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

/*───────────────────────────────────────────────────────────────────────────┐
│  4 · embedding comparison                                                  │
└───────────────────────────────────────────────────────────────────────────*/

/**
 * Compare one embedding against an array of embeddings and return them ordered by similarity.
 * Uses Euclidean distance as the similarity metric (smaller distance = more similar).
 *
 * @param query - The query embedding to compare against
 * @param candidates - Array of candidate embeddings to compare with
 * @param n - Optional number of top results to return (default: all results)
 * @returns Array of objects with index, embedding, and distance, sorted by distance (ascending)
 *
 * @example
 * ```ts
 * import { LLM } from "@tidy-ts/ai";
 *
 * // Get embeddings for query and candidates
 * const query = await LLM.embed("The cat sits on the mat");
 * const candidates = await LLM.embed([
 *   "A feline rests on the rug",
 *   "Python is a programming language",
 *   "The dog runs in the park"
 * ]);
 *
 * // Find most similar embeddings
 * const results = LLM.compareEmbeddings({ query, candidates });
 * console.log(results[0].index); // Index of most similar
 * console.log(results[0].distance); // Distance to most similar
 *
 * // Get only top 2 results
 * const top2 = LLM.compareEmbeddings({ query, candidates, n: 2 });
 * console.log(top2.length); // 2
 * ```
 */
function _compareEmbeddings({
  query,
  candidates,
  n,
}: {
  query: number[];
  candidates: number[][];
  n?: number;
}): Array<{ index: number; embedding: number[]; distance: number }> {
  // Calculate Euclidean distance for each candidate
  const results = candidates.map((candidate, index) => {
    const distance = Math.sqrt(
      query.reduce((sum, val, i) => sum + Math.pow(val - candidate[i], 2), 0),
    );
    return { index, embedding: candidate, distance };
  });

  // Sort by distance (ascending - smaller is more similar)
  results.sort((a, b) => a.distance - b.distance);

  // Return top n results if specified
  return n !== undefined ? results.slice(0, n) : results;
}

/*───────────────────────────────────────────────────────────────────────────┐
│  5 · LLM utility object                                                    │
└───────────────────────────────────────────────────────────────────────────*/

/**
 * LLM utility functions for language models and embeddings.
 *
 * @example
 * ```typescript
 * import { LLM } from "@tidy-ts/dataframe";
 * import { z } from "zod";
 *
 * // Get embeddings
 * const embedding = await LLM.embed("Hello world");
 * console.log(embedding.length); // 3072
 *
 * // Get structured response
 * const result = await LLM.respond({
 *   userInput: "What is 2+2?",
 *   schema: z.object({ answer: z.number() }),
 * });
 * console.log(result.answer); // 4
 *
 * // Compare embeddings
 * const query = await LLM.embed("cat");
 * const candidates = await LLM.embed(["dog", "car", "kitten"]);
 * const results = LLM.compareEmbeddings({ query, candidates, n: 2 });
 * console.log(results[0].index); // Index of most similar
 * ```
 */
export const LLM: {
  /** Get vector embeddings for text using OpenAI's embeddings API */
  readonly embed: typeof getEmbeddings;
  /** Get structured responses from language models with Zod schema validation */
  readonly respond: typeof respond;
} = {
  embed: getEmbeddings,
  respond,
};
