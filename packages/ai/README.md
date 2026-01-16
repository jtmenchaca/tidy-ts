# @tidy-ts/ai

[![JSR](https://jsr.io/badges/@tidy-ts/ai)](https://jsr.io/@tidy-ts/ai)
[![JSR Score](https://jsr.io/badges/@tidy-ts/ai/score)](https://jsr.io/@tidy-ts/ai)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

AI utilities for TypeScript with structured output using Zod schema validation and type inference.

## Installation

```bash
deno add jsr:@tidy-ts/ai // Deno
bunx jsr add @tidy-ts/ai // bun
pnpm add jsr:@tidy-ts/ai // pnpm
npx jsr add @tidy-ts/ai // npm
yarn add jsr:@tidy-ts/ai // yarn
```

## Features

- **Structured LLM Responses**: Get type-safe responses from language models using Zod schemas
- **Vector Embeddings**: Generate embeddings for text using OpenAI's embeddings API
- **Embedding Comparison**: Compare embeddings using Euclidean distance for similarity search
- **Automatic Date Conversion**: Automatically converts `z.date()` fields to/from ISO datetime strings
- **Full TypeScript Support**: Complete type inference for all responses

## Quick Start

```typescript
import { LLM } from "@tidy-ts/ai";
import { z } from "zod";

// Get embeddings
const embedding = await LLM.embed("Hello world");
console.log(embedding.length); // 3072 for text-embedding-3-large

// Get structured response
const result = await LLM.respond({
  userInput: "What is 2+2?",
  schema: z.object({ answer: z.number() }),
});
console.log(result.answer); // 4 (typed as number)

// Compare embeddings
const query = await LLM.embed("cat");
const candidates = await LLM.embed(["dog", "car", "kitten"]);
const results = LLM.compareEmbeddings({ query, candidates, n: 2 });
console.log(results[0].index); // Index of most similar
```

## API Reference

### `LLM.embed(input, model?)`

Get vector embeddings for text using OpenAI's embeddings API.

- **Single string**: Returns `Promise<number[]>`
- **Array of strings**: Returns `Promise<number[][]>`
- **Models**: `"text-embedding-3-small"` (1536 dims), `"text-embedding-3-large"` (3072 dims, default), `"text-embedding-ada-002"` (1536 dims)

### `LLM.respond(options)`

Get structured responses from language models with Zod schema validation.

- **Without schema**: Returns `Promise<string>`
- **With schema**: Returns `Promise<z.infer<Schema>>`
- **Automatic date conversion**: `z.date()` fields are automatically converted to/from ISO datetime strings
- **Models**: `"gpt-4.1-mini"` (default), `"gpt-4.1"`, `"gpt-5-mini"`

### `LLM.compareEmbeddings(options)`

Compare one embedding against an array of embeddings and return them ordered by similarity.

- Uses Euclidean distance (smaller distance = more similar)
- Returns array of `{ index, embedding, distance }` sorted by distance (ascending)

## Requirements

- **OpenAI API Key**: Set `OPENAI_API_KEY` environment variable
- **Deno 2.0+**, **Node.js 18+**, **Bun**, or modern browser

## License

MIT

