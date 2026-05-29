import { readXLSX } from "../../../packages/dataframe/mod.ts";
import { z } from "zod";

const BASE = "docs/JAMIA/comparisons/RPython-main";

const soSchema = z.object({
  StackOverflow: z.string(),
  Bug: z.string(),
  Cause: z.string(),
  Effect: z.string(),
  "": z.string().optional(),
  _2: z.string().optional(),
  StackOverflow_2: z.string(),
  Bug_2: z.string(),
  Cause_2: z.string(),
  Effect_2: z.string(),
});

const datasets = [
  { label: "TM_DFB", path: `${BASE}/RootCause_BugType Dataset/TM_DFB/TM_DFB.xlsx`, output: `${BASE}/TM_DFB_snippets.json` },
  { label: "TM", path: `${BASE}/RootCause Dataset/TM/TM.xlsx`, output: `${BASE}/TM_snippets.json` },
  { label: "IDAP_IB", path: `${BASE}/RootCause_BugType Dataset/IDAP_IB/IDAP_IB.xlsx`, output: `${BASE}/IDAP_IB_snippets.json` },
  { label: "CDA", path: `${BASE}/RootCause_BugType Dataset/CDA_(CFB_DB_IB_LB_PB)/CDA_{CFB_DB_IB_LB_PB}.xlsx`, output: `${BASE}/CDA_snippets.json` },
  { label: "APIC", path: `${BASE}/RootCause Dataset/APIC/APIC.xlsx`, output: `${BASE}/APIC_snippets.json` },
  { label: "SM", path: `${BASE}/RootCause Dataset/SM/SM.xlsx`, output: `${BASE}/SM_snippets.json` },
];

type Entry = { url: string; id: number; lang: "Python" | "R"; bug: string; cause: string; effect: string };
type Snippet = {
  id: number; url: string; lang: "Python" | "R"; bug: string; cause: string; effect: string;
  title: string; tags: string[]; score: number;
  question_code: string[]; question_text: string;
  top_answer_code: string[]; top_answer_text: string;
  accepted_answer_code: string[]; accepted_answer_text: string;
};

function chunk<T>(arr: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < arr.length; i += size) chunks.push(arr.slice(i, i + size));
  return chunks;
}

async function fetchBatch(ids: number[], endpoint: string): Promise<unknown[]> {
  const url = `https://api.stackexchange.com/2.3/questions/${ids.join(";")}${endpoint}?site=stackoverflow&filter=withbody&pagesize=100`;
  const resp = await fetch(url);
  if (!resp.ok) {
    console.warn(`  WARN: HTTP ${resp.status} for batch starting ${ids[0]}`);
    return [];
  }
  const data = await resp.json();
  if (data.backoff) {
    console.log(`  Backoff: ${data.backoff}s`);
    await new Promise(r => setTimeout(r, data.backoff * 1000));
  }
  console.log(`  Fetched ${data.items?.length ?? 0}, quota: ${data.quota_remaining}`);
  // deno-lint-ignore no-explicit-any
  let allItems: any[] = data.items ?? [];
  let page = 2;
  let hasMore = data.has_more;
  while (hasMore) {
    const pageResp = await fetch(`${url}&page=${page}`);
    const pageData = await pageResp.json();
    allItems = allItems.concat(pageData.items ?? []);
    hasMore = pageData.has_more;
    page++;
    console.log(`  Page ${page - 1}: +${pageData.items?.length ?? 0}, quota: ${pageData.quota_remaining}`);
    if (pageData.backoff) await new Promise(r => setTimeout(r, pageData.backoff * 1000));
  }
  return allItems;
}

function extractCode(html: string): string[] {
  const blocks: string[] = [];
  const preCodeRegex = /<pre[^>]*><code[^>]*>([\s\S]*?)<\/code><\/pre>/g;
  let match;
  while ((match = preCodeRegex.exec(html)) !== null) blocks.push(decodeHtml(match[1]));
  if (blocks.length === 0) {
    const codeRegex = /<code>([\s\S]*?)<\/code>/g;
    while ((match = codeRegex.exec(html)) !== null) {
      const decoded = decodeHtml(match[1]);
      if (decoded.includes("\n") || decoded.length > 50) blocks.push(decoded);
    }
  }
  return blocks;
}

function decodeHtml(html: string): string {
  return html
    .replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&")
    .replace(/&#39;/g, "'").replace(/&quot;/g, '"')
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)));
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, "").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&").replace(/&#39;/g, "'").replace(/&quot;/g, '"');
}

for (const ds of datasets) {
  console.log(`\n${"=".repeat(60)}\n${ds.label}\n${"=".repeat(60)}`);

  const df = await readXLSX(ds.path, soSchema, { skip: 1 });

  const entries: Entry[] = [];
  df.forEach((r) => {
    if (r.StackOverflow.startsWith("https://")) {
      entries.push({
        url: r.StackOverflow,
        id: Number(r.StackOverflow.split("/").pop()),
        lang: "Python",
        bug: r.Bug, cause: r.Cause, effect: r.Effect,
      });
    }
    if (r.StackOverflow_2.startsWith("https://")) {
      entries.push({
        url: r.StackOverflow_2,
        id: Number(r.StackOverflow_2.split("/").pop()),
        lang: "R",
        bug: r.Bug_2, cause: r.Cause_2, effect: r.Effect_2,
      });
    }
  });

  console.log(`Entries: ${entries.length} (${entries.filter(e => e.lang === "Python").length} Py, ${entries.filter(e => e.lang === "R").length} R)`);

  const allIds = [...new Set(entries.map(e => e.id))].filter(id => !isNaN(id) && id > 0);
  console.log(`Unique question IDs: ${allIds.length}`);

  // deno-lint-ignore no-explicit-any
  const questions = new Map<number, any>();
  // deno-lint-ignore no-explicit-any
  const answers = new Map<number, any[]>();

  for (const batch of chunk(allIds, 20)) {
    console.log(`\nBatch: ${batch.length} IDs`);
    // deno-lint-ignore no-explicit-any
    for (const q of await fetchBatch(batch, "") as any[]) questions.set(q.question_id, q);
    console.log("Answers...");
    // deno-lint-ignore no-explicit-any
    for (const a of await fetchBatch(batch, "/answers") as any[]) {
      if (!answers.has(a.question_id)) answers.set(a.question_id, []);
      answers.get(a.question_id)!.push(a);
    }
  }

  const snippets: Snippet[] = [];
  let missing = 0;
  for (const entry of entries) {
    if (isNaN(entry.id)) continue;
    const q = questions.get(entry.id);
    if (!q) { missing++; continue; }
    // deno-lint-ignore no-explicit-any
    const qAnswers = (answers.get(entry.id) ?? []).sort((a: any, b: any) => b.score - a.score);
    const topAnswer = qAnswers[0];
    // deno-lint-ignore no-explicit-any
    const acceptedAnswer = qAnswers.find((a: any) => a.is_accepted);
    snippets.push({
      id: entry.id, url: entry.url, lang: entry.lang, bug: entry.bug, cause: entry.cause, effect: entry.effect,
      title: q.title, tags: q.tags, score: q.score,
      question_code: extractCode(q.body), question_text: stripHtml(q.body).slice(0, 500),
      top_answer_code: topAnswer ? extractCode(topAnswer.body) : [], top_answer_text: topAnswer ? stripHtml(topAnswer.body).slice(0, 500) : "",
      accepted_answer_code: acceptedAnswer ? extractCode(acceptedAnswer.body) : [], accepted_answer_text: acceptedAnswer ? stripHtml(acceptedAnswer.body).slice(0, 500) : "",
    });
  }

  await Deno.writeTextFile(ds.output, JSON.stringify(snippets, null, 2));

  console.log(`\nWrote ${snippets.length} snippets to ${ds.output.split("/").pop()}`);
  if (missing > 0) console.log(`  (${missing} entries had missing questions)`);
  console.log(`  With question code: ${snippets.filter(s => s.question_code.length > 0).length}`);
  console.log(`  With answer code: ${snippets.filter(s => s.top_answer_code.length > 0).length}`);
  console.log(`  Python: ${snippets.filter(s => s.lang === "Python").length}, R: ${snippets.filter(s => s.lang === "R").length}`);
}
