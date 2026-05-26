// Task: HTTP retries + typed Result, envelope encryption round-trip,
// and concurrency-capped parallel fetch.
//
// Built entirely from /Users/jtmenchaca/tidy-ts/.claude/skills/tidy-ts-best-practices.

import {
  tidyfetch,
  HTTPError,
  TimeoutError,
  NetworkError,
  ParseError,
  AbortError,
  generateKey,
  encryptFields,
  decryptFields,
  parallel,
} from "@tidy-ts/shims";

// ---------------------------------------------------------------------------
// Task 1: typed HTTP with retries
// ---------------------------------------------------------------------------

type Body = { hello: string };

function categorize(error: unknown): string {
  if (error instanceof HTTPError) return `HTTPError(${error.statusCode})`;
  if (error instanceof TimeoutError) return "TimeoutError";
  if (error instanceof NetworkError) return "NetworkError";
  if (error instanceof ParseError) return "ParseError";
  if (error instanceof AbortError) return "AbortError";
  return "UnknownError";
}

async function fetchWithRetries(url: string) {
  return await tidyfetch<Body>({
    url,
    retry: 3,
    retryDelay: 200,
    timeout: 1500,
  });
}

console.log("--- Task 1: HTTP with retries ---");
const r1 = await fetchWithRetries("https://localhost:1/never");
if (r1.ok) {
  console.log("Succeeded:", r1.value);
} else {
  console.log(`Failed: category=${categorize(r1.error)} message=${r1.error.message}`);
}

// ---------------------------------------------------------------------------
// Task 2: envelope encryption round-trip
// ---------------------------------------------------------------------------

console.log("\n--- Task 2: envelope encryption round-trip ---");

const masterKey = generateKey();
const masterKeyId = "mk_v1";
const plaintext = "patient-record-12345-confidential";

const encResult = await encryptFields({
  fields: { secret: plaintext },
  masterKey,
  masterKeyId,
});

if (!encResult.ok) {
  console.log("Encryption failed:", encResult.error.message);
} else {
  const { encrypted, dek } = encResult.value;
  const ciphertext = encrypted.secret;
  const cipherPreview =
    typeof ciphertext === "string" ? ciphertext.slice(0, 24) : String(ciphertext);
  console.log(`Ciphertext prefix: ${cipherPreview}...`);
  console.log(`DEK prefix: ${dek.slice(0, 12)}...`);

  const masterKeys: Record<string, string> = { [masterKeyId]: masterKey };
  const decResult = await decryptFields({
    fields: encrypted,
    dek,
    getMasterKey: (keyId) => masterKeys[keyId],
  });

  if (!decResult.ok) {
    console.log("Decryption failed:", decResult.error.message);
  } else {
    const roundTripped = decResult.value.secret;
    console.log(`Decrypted plaintext: ${roundTripped}`);
    console.log(`Round-trip equal? ${roundTripped === plaintext}`);
  }
}

// ---------------------------------------------------------------------------
// Task 3: 8 URLs with concurrency cap of 3
// ---------------------------------------------------------------------------

console.log("\n--- Task 3: 8 URLs, concurrency=3 ---");

const urls: string[] = Array.from({ length: 8 }, () => "https://localhost:1/never");

const fetchResults = await parallel(
  urls.map((url) => () => tidyfetch<Body>({ url, timeout: 1000 })),
  { concurrency: 3 },
);

let okCount = 0;
let errCount = 0;
const errorCategoryCounts: Record<string, number> = {};

for (const r of fetchResults) {
  if (r.ok) {
    okCount += 1;
  } else {
    errCount += 1;
    const cat = categorize(r.error);
    errorCategoryCounts[cat] = (errorCategoryCounts[cat] ?? 0) + 1;
  }
}

console.log(`Total results: ${fetchResults.length}`);
console.log(`Successes: ${okCount}`);
console.log(`Failures:  ${errCount}`);
console.log(`Failures by category: ${JSON.stringify(errorCategoryCounts)}`);
