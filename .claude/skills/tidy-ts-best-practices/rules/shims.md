---
name: shims
description: "@tidy-ts/shims — cross-runtime helpers that work identically in Deno, Bun, and Node. Result types, tidyfetch, concurrency (parallel/batch), filesystem, encryption (AES-256-GCM + envelope), env / args / runtime detection, path utilities."
metadata:
  tags: shims, deno, bun, node, fetch, result, fs, encryption, env, runtime
---

# Cross-runtime shims (`@tidy-ts/shims`)

Use these whenever you'd reach for `Deno.*`, `process.env`, `fs.*`, or `fetch` — they work identically in Deno, Bun, and Node.

## Result types

```typescript
import { type Result, ok, err, tryAsync, defineError, type AppError } from "@tidy-ts/shims";

// Discriminated union: { ok: true; value: T } | { ok: false; error: E }
function divide(a: number, b: number): Result<number, string> {
  if (b === 0) return err("Division by zero");
  return ok(a / b);
}

const r = divide(10, 2);
if (r.ok) console.log(r.value);
else      console.error(r.error);
```

See [async-and-result.md](async-and-result.md) for `tryAsync` and `defineError` patterns.

## tidyfetch — enhanced cross-runtime fetch

Returns `Result<T, TidyFetchError>` with auto JSON parsing/stringification, retries, timeouts, interceptors, and response caching.

```typescript
import { tidyfetch, HTTPError, TimeoutError, NetworkError } from "@tidy-ts/shims";

const result = await tidyfetch<User>({ url: "/api/users/1", timeout: 5000 });

if (!result.ok) {
  if (result.error instanceof HTTPError) {
    console.log(`HTTP ${result.error.statusCode}: ${result.error.body}`);
  } else if (result.error instanceof TimeoutError) {
    console.log(`Timed out after ${result.error.timeout}ms`);
  } else if (result.error instanceof NetworkError) {
    console.log(`Network error: ${result.error.message}`);
  }
  return;
}

console.log(result.value.name);

// POST with body — plain objects auto-stringified
await tidyfetch<User>({
  url: "/api/users",
  method: "POST",
  body: { name: "Alice", email: "alice@example.com" },
});

// With retry
await tidyfetch<Data>({
  url: "/api/data",
  retry: 3,
  retryDelay: 1000,
  retryStatusCodes: [408, 429, 500, 502, 503, 504],  // default
});

// Preconfigured instance
const api = tidyfetch.create({
  baseURL: "https://api.example.com",
  headers: { Authorization: `Bearer ${token}` },
  timeout: 10_000,
});
const r = await api<User[]>({ url: "/users" });

// Shortcuts
await tidyfetch.get<User[]>({ url: "/api/users", query: { limit: 10 } });
await tidyfetch.post<User>({ url: "/api/users", body: { name: "Alice" } });

// Access headers + status
await tidyfetch.raw<User>({ url: "/api/users/1" });
// result.value: RawResponse<User> with .status, .headers, ._data (parsed)
```

`TidyFetchError = NetworkError | TimeoutError | HTTPError | ParseError | AbortError`. Narrow with `instanceof`.

## Concurrency — parallel / batch / chunk

```typescript
import { parallel, batch, chunk } from "@tidy-ts/shims";

// Limit concurrent promises
const results = await parallel(
  [fetchUser(1), fetchUser(2), fetchUser(3)],
  { concurrency: 2 },
);

// With retry — pass factories (not started promises)
await parallel(
  [() => fetchUser(1), () => fetchUser(2), () => fetchUser(3)],
  {
    concurrency: 5,
    retry: { backoff: "exponential", maxRetries: 3, baseDelay: 100 },
  },
);

// settled: true → like Promise.allSettled
const results = await parallel(tasks, { concurrency: 5, settled: true });
// SettledResult<T>[] = { status: 'fulfilled'; value: T } | { status: 'rejected'; reason: unknown }

// Map over items with concurrency
await batch(userIds, async (id) => fetchUser(id), { concurrency: 5 });

// Split into chunks
chunk([1, 2, 3, 4, 5, 6], 3);  // [[1, 2, 3], [4, 5, 6]]
```

### Retry strategies

```typescript
// Exponential — delay = baseDelay * backoffMultiplier^attempt, capped at maxDelay
{ backoff: "exponential", maxRetries: 3, baseDelay: 100, backoffMultiplier: 2, maxDelay: 5000 }

// Linear — delay = baseDelay * attempt
{ backoff: "linear", maxRetries: 3, baseDelay: 200 }

// Custom — full control
{
  backoff: "custom",
  maxRetries: 5,
  backoffFn: (error, attempt, taskIndex) =>
    error.status === 429 ? 5000 * attempt : 100 * Math.pow(2, attempt),
  shouldRetry: (error) => error.status !== 401,
  onRetry: (error, attempt, taskIndex) => console.log(`retry ${attempt}`),
}
```

## Filesystem

```typescript
import {
  readFile, readTextFile, writeFile, writeTextFile,
  mkdir, stat, remove, listDir, copyFile, rename, exists, open,
  readFileSync, writeFileSync, writeTextFileSync,
} from "@tidy-ts/shims";

const text = await readTextFile("./config.json");
const bytes = await readFile("./file.bin");

await writeTextFile("./output.txt", "Hello");        // parent dirs auto-created
await writeFile("./output.bin", new Uint8Array([1, 2, 3]));

await mkdir("./path/to/nested", { recursive: true }); // often unnecessary — write* auto-creates parents
await remove("./file.txt");
await remove("./my-dir", { recursive: true });        // for non-empty dirs

const info = await stat("./file.txt");                 // { size, isFile, isDirectory, mtime, atime, birthtime }
const entries = await listDir("./my-dir");             // DirEntry[]

await copyFile("./src.txt", "./dest.txt");             // overwrites by default
await copyFile("./src.txt", "./dest.txt", { overwrite: false });
await rename("./old.txt", "./new.txt");                // atomic; works for dirs

if (await exists("./config.json")) { /* ... */ }       // never throws
```

Sync variants (`readFileSync`, `writeFileSync`, `writeTextFileSync`) exist for cases where async I/O isn't possible — avoid in async contexts (blocks the event loop).

## Encryption — AES-256-GCM

```typescript
import { encrypt, decrypt, generateKey, InvalidKeyError, DecryptionError } from "@tidy-ts/shims";

const key = generateKey();  // 64-hex-char string (32 bytes)

const enc = await encrypt({ key, data: "secret message" });
if (enc.ok) console.log(enc.value);  // Base64URL by default

const dec = await decrypt({ key, data: enc.value });
if (dec.ok) console.log(dec.value);  // "secret message"
```

Output format: `IV (12 bytes) + Ciphertext + Auth Tag (16 bytes)`. Each call generates a fresh IV. Authentication tag is verified on decrypt — `DecryptionError` means wrong key, corrupted data, or tampering.

Encodings: `inputEncoding` / `outputEncoding` (`'utf8' | 'base64' | 'hex' | 'binary'`); `urlSafe: true` (default) returns Base64URL.

### Envelope encryption (per-record DEK + master key)

```typescript
import { encryptFields, decryptFields, rotateMasterKey } from "@tidy-ts/shims";

const masterKey = generateKey();
const masterKeyId = "mk_v1";

// Encrypt fields with a freshly generated DEK; DEK is wrapped with masterKey.
const r = await encryptFields({
  fields: { ssn: "123-45-6789", email: "user@example.com", name: null },
  masterKey,
  masterKeyId,
});
// r.value: { encrypted: { ssn, email, name }, dek: "mk_v1:..." }

// Decrypt — getMasterKey callback resolves the master key by ID
const masterKeys = { mk_v1: process.env.MASTER_KEY_V1!, mk_v2: process.env.MASTER_KEY_V2! };
const d = await decryptFields({
  fields: record.encrypted,
  dek: record.dek,
  getMasterKey: (keyId) => masterKeys[keyId],
});

// Rotate the master key for a single record — encrypted data unchanged, only DEK rewrapped.
const rot = await rotateMasterKey({
  dek: record.dek,
  newMasterKey: process.env.MASTER_KEY_V2!,
  newMasterKeyId: "mk_v2",
  getMasterKey: (keyId) => masterKeys[keyId],
});
```

Errors: `EnvelopeEncryptionError` / `EnvelopeDecryptionError` (with optional `field`), `KeyNotFoundError`, `InvalidKeyIdError`.

### Base64URL helpers

```typescript
import { toBase64URL, fromBase64URL } from "@tidy-ts/shims";
toBase64URL("SGVsbG8rV29ybGQv");    // "SGVsbG8tV29ybGRf"
fromBase64URL("SGVsbG8tV29ybGRf");  // "SGVsbG8rV29ybGQv"
```

## Env, args, exit, test

```typescript
import { env, args, getArgs, exit, test } from "@tidy-ts/shims";

env.get("API_KEY")                                  // string | undefined
env.set("DEBUG", "true")
env.delete("TEMP_VAR")
env.toObject()                                      // Record<string, string>

await env.loadFromFile(".env");                     // exports to process env by default
await env.loadFromFile([".env", ".env.local"]);     // later overrides earlier
await env.loadFromFile(".env", { export: false });  // load without exporting
env.loadFromFileSync(".env");                       // sync variant

args                                                // readonly string[] of CLI args (excludes runtime+script)
getArgs()                                           // function form, same data

exit(0)                                             // success
exit(1)                                             // failure

// Cross-runtime test runner (Deno / Bun / Node)
test("addition works", () => {
  if (1 + 1 !== 2) throw new Error("Math is broken!");
});
test("slow op", async () => { await slow(); }, { timeout: 5000 });
test("not ready", () => { /* ... */ }, { skip: true });
```

`.env` files never override existing process env variables.

## Runtime detection

```typescript
import { getCurrentRuntime, currentRuntime, Runtime, UnavailableAPIError } from "@tidy-ts/shims";

// Cached value (preferred for hot paths)
if (currentRuntime === Runtime.Browser) { /* ... */ }

// Function form
const rt = getCurrentRuntime();
switch (rt) {
  case Runtime.Deno: case Runtime.Bun: case Runtime.Node: /* server */
  case Runtime.Browser: /* browser */
  case Runtime.Tauri: case Runtime.Workerd: case Runtime.Netlify:
  case Runtime.EdgeLight: case Runtime.Fastly: case Runtime.Unsupported:
}

// Catch APIs not available in the current runtime
try {
  await readFile("./file.txt");
} catch (e) {
  if (e instanceof UnavailableAPIError) console.error("FS not available here");
}
```

Prefer runtime-agnostic shims over branching on runtime when possible.

## Path

```typescript
import { resolve, dirname, fileURLToPath, pathToFileURL } from "@tidy-ts/shims";

resolve("./data", "file.txt")                       // absolute path
dirname("/path/to/file.txt")                        // "/path/to"

// __filename / __dirname equivalents for ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

pathToFileURL("/path/to/file.txt").href             // "file:///path/to/file.txt"
```

## Anti-patterns

- ❌ Importing from `Deno.*`, `node:fs`, or using `process.env` directly when writing cross-runtime code — use shims.
- ❌ Raw `fetch` for production — use `tidyfetch` for typed errors, retries, and timeouts.
- ❌ `Promise.all` for rate-limited APIs — use `batch` or `parallel` with `concurrency`.
- ❌ Passing started promises to `parallel` with `retry` — pass factories `() => promise`.
- ❌ Hardcoding encryption keys in source — generate at deploy time, store in env/secrets.
- ❌ Sync I/O (`readFileSync`, `writeFileSync`) inside async handlers — blocks the event loop.
- ❌ Race conditions on `exists()` then `readFile()` — file may be deleted in between; handle the error instead.
