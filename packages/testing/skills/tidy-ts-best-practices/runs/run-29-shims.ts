import {
  type AppError,
  defineError,
  env,
  parallel,
  tryAsync,
  writeTextFile,
} from "@tidy-ts/shims";

// --- Step 1: read TIDY_TEST_TARGET ---
const target = env.get("TIDY_TEST_TARGET") ?? "hello";

// --- Step 2: slowOperation + RuntimeError ---
const RuntimeError = defineError(
  "RuntimeError",
  ({ message }: { message: string }) => message,
);
type RuntimeError = AppError<"RuntimeError", { message: string }>;

async function slowOperation(
  name: string,
  willFail: boolean,
): Promise<string> {
  if (willFail) {
    throw new RuntimeError({ message: `operation ${name} failed` });
  }
  const delayMs = 10 + Math.floor(Math.random() * 41); // 10-50ms
  await new Promise((resolve) => setTimeout(resolve, delayMs));
  return `ok: ${name}`;
}

// --- Step 3: run 5 inputs concurrently (limit 2), capture into typed results ---
const start = performance.now();

// Three expected to succeed (willFail=false), two expected to fail (willFail=true).
// Use a flaky map so the second call (retry) for a failing op flips to success.
type Input = { name: string; willFail: boolean };
const inputs: Input[] = [
  { name: `${target}-a`, willFail: false },
  { name: `${target}-b`, willFail: false },
  { name: `${target}-c`, willFail: false },
  { name: `${target}-d`, willFail: true },
  { name: `${target}-e`, willFail: true },
];

// Track per-name call counts so a retry can flip willFail -> false.
const calls = new Map<string, number>();
async function runOne(input: Input): Promise<string> {
  const prior = calls.get(input.name) ?? 0;
  calls.set(input.name, prior + 1);
  // On the second call (retry), flip the flake to succeed.
  const effectiveWillFail = prior >= 1 ? false : input.willFail;
  return await slowOperation(input.name, effectiveWillFail);
}

// Wrap each task in tryAsync so failures become Result entries; then run with
// parallel using concurrency:2.  Each task is a factory (() => Promise<...>).
type Outcome =
  | { ok: true; name: string; value: string }
  | { ok: false; name: string; error: RuntimeError };

const taskFactories: Array<() => Promise<Outcome>> = inputs.map(
  (input) => async () => {
    const r = await tryAsync({
      fn: () => runOne(input),
      mapError: (e) =>
        new RuntimeError({
          message: e instanceof Error ? e.message : String(e),
        }),
    });
    if (r.ok) {
      return { ok: true, name: input.name, value: r.value } as const;
    }
    return { ok: false, name: input.name, error: r.error } as const;
  },
);

const firstPass = await parallel(taskFactories, { concurrency: 2 });

// --- Step 4: retry failures once, with a small delay ---
const failedAfterFirst = firstPass.filter((o): o is Extract<Outcome, { ok: false }> => !o.ok);

const retryFactories: Array<() => Promise<Outcome>> = failedAfterFirst.map(
  (failed) => async () => {
    await new Promise((resolve) => setTimeout(resolve, 25));
    const original = inputs.find((i) => i.name === failed.name)!;
    const r = await tryAsync({
      fn: () => runOne(original),
      mapError: (e) =>
        new RuntimeError({
          message: e instanceof Error ? e.message : String(e),
        }),
    });
    if (r.ok) {
      return { ok: true, name: failed.name, value: r.value } as const;
    }
    return { ok: false, name: failed.name, error: r.error } as const;
  },
);

const retryOutcomes = await parallel(retryFactories, { concurrency: 2 });

// Merge retry results back over the originals (by name).
const byName = new Map<string, Outcome>();
for (const o of firstPass) byName.set(o.name, o);
for (const o of retryOutcomes) byName.set(o.name, o);

const finalOutcomes = inputs.map((i) => byName.get(i.name)!);

const succeeded = finalOutcomes.filter((o) => o.ok).length;
const failed = finalOutcomes.filter((o) => !o.ok).length;
const total = finalOutcomes.length;
const durationMs = Math.round(performance.now() - start);

console.log(`Run summary: ${succeeded} succeeded, ${failed} failed of ${total}`);

// --- Step 5: write JSON summary via shims writeTextFile ---
const summary = { target, total, succeeded, failed, durationMs };
await writeTextFile("/tmp/run29-summary.json", JSON.stringify(summary, null, 2));

// --- Step 6: print JSON summary to stdout ---
console.log(JSON.stringify(summary, null, 2));
