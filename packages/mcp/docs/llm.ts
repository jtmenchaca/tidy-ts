import type { DocEntry } from "./mcp-types.ts";

export const llmDocs: Record<string, DocEntry> = {
  // LLM Utilities
  LLMEmbed: {
    name: "LLM.embed",
    category: "llm",
    signature:
      'LLM.embed(input: string | string[], model?: "text-embedding-3-small" | "text-embedding-3-large" | "text-embedding-ada-002"): Promise<number[] | number[][]>',
    description:
      "Get vector embeddings for text using OpenAI's embeddings API. Single string returns number[], array returns number[][]. Default model is text-embedding-3-large (3072 dimensions).",
    imports: ['import { LLM } from "@tidy-ts/ai";'],
    parameters: [
      "input: Text string or array of text strings to embed",
      'model: Embedding model (default: "text-embedding-3-large")',
      "  - text-embedding-3-small: 1536 dimensions, faster, lower cost",
      "  - text-embedding-3-large: 3072 dimensions, better quality (default)",
      "  - text-embedding-ada-002: Legacy model, 1536 dimensions",
    ],
    returns:
      "Promise<number[]> for single string, Promise<number[][]> for array",
    examples: [
      '// Single text\nconst embedding = await LLM.embed("Hello world")\nconsole.log(embedding.length) // 3072',
      '// Multiple texts\nconst embeddings = await LLM.embed(["doc1", "doc2", "doc3"])\nconsole.log(embeddings.length) // 3\nconsole.log(embeddings[0].length) // 3072',
      '// Use smaller/faster model\nconst embedding = await LLM.embed("text", "text-embedding-3-small")\nconsole.log(embedding.length) // 1536',
      '// Use with DataFrame\nconst df = createDataFrame([{ text: "cat" }, { text: "dog" }])\nconst withEmbeddings = await df.mutate({\n  embedding: async (row) => await LLM.embed(row.text)\n})',
    ],
    related: ["LLM.compareEmbeddings", "LLM.respond"],
    bestPractices: [
      "✓ GOOD: Use text-embedding-3-large for best quality (default)",
      "✓ GOOD: Use text-embedding-3-small for faster/cheaper embeddings",
      "✓ GOOD: Batch multiple texts in an array for efficiency",
      "✓ GOOD: Store embeddings in vector databases for similarity search",
      "Environment variable OPENAI_API_KEY must be set",
    ],
  },

  LLMRespond: {
    name: "LLM.respond",
    category: "llm",
    signature:
      "LLM.respond({ userInput, schema?, priorMessages?, instructions?, model? }): Promise<string | T>",
    description:
      "Get structured responses from language models with Zod schema validation. Returns string without schema, typed object with schema. Automatically converts z.date() fields.",
    imports: [
      'import { LLM } from "@tidy-ts/ai"',
      'import { z } from "zod"',
    ],
    parameters: [
      "userInput: The prompt/question to send to the LLM",
      "schema: Optional Zod schema for structured output",
      "priorMessages: Optional conversation history for context",
      'instructions: System instructions (default: "You are a helpful assistant.")',
      'model: OpenAI model - "gpt-4.1-mini" (default), "gpt-4.1", "gpt-5-mini"',
    ],
    returns: "Promise<string> without schema, Promise<T> with schema",
    examples: [
      '// Simple string response\nconst answer = await LLM.respond({\n  userInput: "What is 2+2?"\n})\nconsole.log(answer) // "4"',
      '// Structured response\nconst result = await LLM.respond({\n  userInput: "Analyze this data",\n  schema: z.object({\n    summary: z.string(),\n    confidence: z.number()\n  })\n})\nconsole.log(result.summary, result.confidence)',
      '// Date handling\nconst event = await LLM.respond({\n  userInput: "When is the next solar eclipse?",\n  schema: z.object({\n    date: z.date(),\n    location: z.string()\n  })\n})\nconsole.log(event.date.getFullYear()) // Date object',
      '// Use with DataFrame\nconst df = createDataFrame([{ question: "What is 2+2?" }])\nconst withAnswers = await df.mutate({\n  answer: async (row) => await LLM.respond({\n    userInput: row.question\n  })\n})',
    ],
    related: ["LLM.embed", "LLM.compareEmbeddings"],
    bestPractices: [
      "✓ GOOD: Use Zod schemas for type-safe structured output",
      "✓ GOOD: Use z.date() for date fields - auto-converted to Date objects",
      "✓ GOOD: Provide clear system instructions for consistent behavior",
      "✓ GOOD: Use priorMessages for conversation context",
      "Environment variable OPENAI_API_KEY must be set",
    ],
  },

  LLMCompareEmbeddings: {
    name: "LLM.compareEmbeddings",
    category: "llm",
    signature:
      "LLM.compareEmbeddings({ query, candidates, n? }): Array<{ index: number; embedding: number[]; distance: number }>",
    description:
      "Compare one embedding against an array of embeddings and return them ordered by similarity. Uses Euclidean distance (smaller = more similar).",
    imports: ['import { LLM } from "@tidy-ts/ai";'],
    parameters: [
      "query: The query embedding to compare against",
      "candidates: Array of candidate embeddings to compare with",
      "n: Optional number of top results to return (default: all)",
    ],
    returns:
      "Array of { index, embedding, distance } sorted by distance (ascending)",
    examples: [
      '// Find similar texts\nconst query = await LLM.embed("The cat sits on the mat")\nconst candidates = await LLM.embed([\n  "A feline rests on the rug",\n  "Python is a programming language",\n  "The dog runs in the park"\n])\n\nconst results = LLM.compareEmbeddings({ query, candidates })\nconsole.log(results[0].index) // Index of most similar\nconsole.log(results[0].distance) // Similarity score',
      "// Get top N results\nconst top3 = LLM.compareEmbeddings({ query, candidates, n: 3 })\nconsole.log(top3.length) // 3",
      '// Semantic search with DataFrame\nconst documents = createDataFrame([\n  { id: 1, text: "Machine learning tutorial" },\n  { id: 2, text: "Cooking recipes" },\n  { id: 3, text: "Deep learning guide" }\n])\n\nconst query = await LLM.embed("AI tutorials")\nconst docEmbeddings = await LLM.embed(documents.extract("text"))\nconst results = LLM.compareEmbeddings({ query, candidates: docEmbeddings, n: 2 })\n\n// Get top matching documents\nconst topDocs = results.map(r => documents.toArray()[r.index])',
    ],
    related: ["LLM.embed", "LLM.respond"],
    bestPractices: [
      "✓ GOOD: Use for semantic search and similarity matching",
      "✓ GOOD: Limit results with n parameter for performance",
      "✓ GOOD: Store embeddings once, compare many times",
      "✓ GOOD: Use with vector databases for large-scale search",
      "Distance metric: Euclidean distance (L2 norm)",
      "Results sorted by distance: smaller distance = more similar",
    ],
  },
};
