---
name: async-and-result
description: Async DataFrame verbs (mutateAsync, filterAsync, summarizeAsync), PromisedDataFrame chaining, ConcurrencyOptions, and how to compose with shims Result types (Result, ok, err, tryAsync, defineError).
metadata:
  tags: async, promise, result, tryAsync, mutateAsync, filterAsync, concurrency, error-handling
---

# Async DataFrame verbs and Result types

## The sync/async split is enforced

TypeScript rejects async functions in sync verbs. Reach for the `*Async` twin whenever a formula or predicate returns a Promise.

| Sync verb   | Async verb            | Result type             |
|-------------|-----------------------|-------------------------|
| `mutate`    | `mutateAsync`         | `PromisedDataFrame`     |
| `filter`    | `filterAsync`         | `PromisedDataFrame`     |
| `summarize` | `summarizeAsync`      | `PromisedDataFrame`     |

`PromisedDataFrame` is still chainable — verbs are queued and awaited when you `await` the chain.

```typescript
await df
  .mutateAsync({ data: async (r) => await fetch(r.url).then((r) => r.json()) },
                { concurrency: 3 })
  .filterAsync(async (r) => (await isValid(r.id)))
  .then((df) => df.print());
```

## ConcurrencyOptions

Optional second argument to `mutateAsync` / `filterAsync` / `summarizeAsync`:

- `concurrency` — max parallel tasks (default 1)
- `batchSize` / `batchDelay` — group tasks into batches with delays between
- `retry` — retry policy (see [shims.md](shims.md) for `RetryConfig`)

## `parallel` / `batch` / `chunk` for free-form async

When you need parallelism outside the DataFrame pipeline (e.g. fan-out a list of URLs), import from `@tidy-ts/shims`:

```typescript
import { parallel, batch, chunk } from "@tidy-ts/shims";

await parallel(
  [() => fetch("/a"), () => fetch("/b")],
  { concurrency: 2 },
);

await batch(items, async (item) => process(item), { concurrency: 5 });

chunk([1, 2, 3, 4, 5, 6], 3);  // [[1, 2, 3], [4, 5, 6]]
```

See [shims.md](shims.md) for retry strategies, `settled: true`, and full options. The same helpers are also re-exposed on `stats` (`s.parallel`, `s.batch`, `s.chunk`) for use inside the DataFrame package — prefer the shims import for cross-runtime app code.

## Composing with `@tidy-ts/shims` Result types

`Result<T, E>` is a discriminated union for explicit error handling:

```typescript
import { type Result, ok, err } from "@tidy-ts/shims";

function divide(a: number, b: number): Result<number, string> {
  if (b === 0) return err("Division by zero");
  return ok(a / b);
}

const result = divide(10, 0);
if (result.ok) {
  console.log(result.value);
} else {
  console.error(result.error);  // typed as string
}
```

### tryAsync — wrap throwing async code with explicit error mapping

```typescript
import { tryAsync, defineError, type AppError } from "@tidy-ts/shims";

const DatabaseError = defineError(
  "DatabaseError",
  ({ query, cause }: { query: string; cause: string }) =>
    `Query failed: ${cause} [${query}]`,
);
type DatabaseError = AppError<"DatabaseError", { query: string; cause: string }>;

const result = await tryAsync({
  fn: () => db.query("SELECT * FROM users"),
  mapError: (e) => new DatabaseError({
    query: "SELECT * FROM users",
    cause: e instanceof Error ? e.message : String(e),
  }),
});

if (!result.ok) {
  console.error(result.error.query);  // typed access
}
```

### defineError + AppError

```typescript
const NotFoundError = defineError(
  "NotFoundError",
  ({ resource, id }: { resource: string; id: string }) =>
    `${resource} with id ${id} not found`,
);
type NotFoundError = AppError<"NotFoundError", { resource: string; id: string }>;

const e = new NotFoundError({ resource: "User", id: "123" });
e.name;      // "NotFoundError"
e.resource;  // "User"
e.message;   // "User with id 123 not found"
```

Pattern: define both the class and a type alias of the same name.

## When to reach for Result vs throwing

- **Predictable failure** (lookup not found, validation fails, parse fails) → `Result<T, E>`.
- **Unexpected programmer errors / invariants** → throw.
- Don't throw inside Result-returning functions; wrap third-party code with `tryAsync`.

## Anti-patterns

- ❌ Async function inside `mutate` / `filter` / `summarize` — TypeScript rejects it; use `*Async`.
- ❌ Passing already-started promises to `s.parallel` with `retry` — retry needs factories `() => promise`.
- ❌ Calling raw `fetch` for network — `tidyfetch` returns `Result<T, TidyFetchError>` with typed errors (see [shims.md](shims.md)).
- ❌ `tryAsync` without `mapError` — there is no default; you must map to a typed error.
