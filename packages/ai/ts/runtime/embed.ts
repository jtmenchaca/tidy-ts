// Embeddings: vector representations of text for similarity work
// (chunking, dedupe, retrieval, classification).
//
// Two functions:
//   - embed(input, model?)         — get OpenAI embeddings
//   - compareEmbeddings({...})     — rank candidates by Euclidean distance
//
// Both honor the process-wide rate limiter via withRateLimit, so the same
// budget that caps LLM calls also caps embedding requests.

// Side-effect import: loads .env once per process so OPENAI_API_KEY is
// available to the OpenAI client. Mirrors evaluate.ts so a user who only
// imports `embed` doesn't silently get a broken client.
import "./_env.ts";

import OpenAI from "openai";
import { withRateLimit } from "./rate-limit.ts";

/** OpenAI embedding models. */
export type EmbeddingModel =
  | "text-embedding-3-small"
  | "text-embedding-3-large"
  | "text-embedding-ada-002";

const DEFAULT_EMBEDDING_MODEL: EmbeddingModel = "text-embedding-3-large";

let _client: OpenAI | null = null;
function client(): OpenAI {
  if (_client === null) _client = new OpenAI();
  return _client;
}

/**
 * Get vector embeddings for text using OpenAI's embeddings API.
 *
 * - Single string → `Promise<number[]>`
 * - Array of strings → `Promise<number[][]>` (order preserved)
 *
 * @example
 * ```ts
 * import { ai } from "@tidy-ts/ai";
 *
 * const v = await ai.embed("Hello world");                  // number[]
 * const vs = await ai.embed(["first", "second"]);           // number[][]
 * const small = await ai.embed("text", "text-embedding-3-small");
 * ```
 */
export async function embed(
  input: string,
  model?: EmbeddingModel,
): Promise<number[]>;
export async function embed(
  input: string[],
  model?: EmbeddingModel,
): Promise<number[][]>;
export async function embed(
  input: string | string[],
  model: EmbeddingModel = DEFAULT_EMBEDDING_MODEL,
): Promise<number[] | number[][]> {
  return await withRateLimit(async () => {
    const response = await client().embeddings.create({
      model,
      input,
      encoding_format: "float",
    });
    // Sort by API-reported index to preserve input order, then strip metadata.
    const embeddings = response.data
      .sort((a, b) => a.index - b.index)
      .map((item) => item.embedding);
    return typeof input === "string" ? embeddings[0] : embeddings;
  });
}

/**
 * Rank candidate embeddings against a query by Euclidean distance
 * (smaller = more similar). Returns each candidate's `index` (in the input
 * order), its `embedding` vector, and the computed `distance`.
 *
 * @example
 * ```ts
 * const query = await ai.embed("cat");
 * const candidates = await ai.embed(["dog", "car", "kitten"]);
 * const top2 = ai.compareEmbeddings({ query, candidates, n: 2 });
 * // top2[0].index → 2 ("kitten")
 * ```
 */
export function compareEmbeddings({
  query,
  candidates,
  n,
}: {
  query: number[];
  candidates: number[][];
  /** If set, return only the top-N most-similar candidates. */
  n?: number;
}): Array<{ index: number; embedding: number[]; distance: number }> {
  const results = candidates.map((candidate, index) => {
    let sumSq = 0;
    for (let i = 0; i < query.length; i++) {
      const diff = query[i] - candidate[i];
      sumSq += diff * diff;
    }
    return { index, embedding: candidate, distance: Math.sqrt(sumSq) };
  });
  results.sort((a, b) => a.distance - b.distance);
  return n !== undefined ? results.slice(0, n) : results;
}
