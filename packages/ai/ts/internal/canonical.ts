// Domain-neutral canonical-JSON encoding + content hashing.
//
// Used by the per-node cache (`datastore.ts`) to compute stable keys
// from fingerprint + input pairs. Lives here, not in datastore.ts,
// because the operation has nothing to do with caching specifically —
// any consumer that needs structurally-stable hashing of arbitrary
// JSON-shaped values should reach for these.
//
// Keep this module dependency-free (no Zod, no runtime types) so it can
// be imported from anywhere in the package without import cycles.

/** Encode `value` as JSON with object keys sorted at every depth.
 *  Returns a stable string for any two structurally-equal inputs,
 *  regardless of original key order. `undefined` encodes as `"null"`
 *  because `JSON.stringify(undefined)` is `undefined`, which would
 *  break string concatenation upstream. */
export function canonicalize(value: unknown): string {
  if (value === undefined) return "null";
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) {
    return "[" + value.map(canonicalize).join(",") + "]";
  }
  const obj = value as Record<string, unknown>;
  const keys = Object.keys(obj).sort();
  return "{" +
    keys.map((k) => JSON.stringify(k) + ":" + canonicalize(obj[k])).join(",") +
    "}";
}

/** SHA-256 of `text` as lowercase hex. Uses `crypto.subtle` (available
 *  in Deno, Node ≥19, and Bun). */
export async function sha256Hex(text: string): Promise<string> {
  const data = new TextEncoder().encode(text);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
