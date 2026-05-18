/**
 * Lookup specific RPython TM snippets by SO ID.
 *
 * Usage:
 *   deno run -A docs/JAMIA/comparisons/RPython/lookup-snippet.ts 22481271 16067144
 *
 * Prints the canonical bug, cause, effect, question text, and top-answer text
 * for each ID — useful when authoring or auditing a reproduction `.ts` file.
 */
const TM_JSON = new URL("./TM_snippets.json", import.meta.url);

interface Snippet {
  id: number;
  url: string;
  lang: string;
  bug: string;
  cause: string;
  effect: string;
  title: string;
  question_text?: string;
  question_code?: string;
  top_answer_text?: string;
  top_answer_code?: string;
}

const TM = JSON.parse(await Deno.readTextFile(TM_JSON)) as Snippet[];
const ids = Deno.args.map((a) => parseInt(a, 10)).filter((n) => !isNaN(n));

if (ids.length === 0) {
  console.error("Usage: deno run -A lookup-snippet.ts <id> [<id> ...]");
  Deno.exit(1);
}

for (const id of ids) {
  const s = TM.find((x) => x.id === id);
  if (!s) {
    console.log(`\n=== SO#${id}: NOT FOUND ===\n`);
    continue;
  }
  console.log(`\n=== SO#${id} ===`);
  console.log(`URL: ${s.url}`);
  console.log(`Lang: ${s.lang}`);
  console.log(`Bug: ${s.bug}`);
  console.log(`Cause: ${s.cause}`);
  console.log(`Effect: ${s.effect}`);
  console.log(`Title: ${s.title}`);
  console.log(`--- Q code ---`);
  console.log(s.question_code ?? "");
  console.log(`--- Q text (first 600) ---`);
  console.log((s.question_text ?? "").slice(0, 600));
  console.log(`--- Top answer code ---`);
  console.log(s.top_answer_code ?? "");
  console.log(`--- Top answer text (first 600) ---`);
  console.log((s.top_answer_text ?? "").slice(0, 600));
}
