import { z } from "zod";

const BASE = "docs/JAMIA/comparisons/RPython-main";

const datasets = [
  { label: "TM_DFB", path: `${BASE}/TM_DFB_snippets.json`, outDir: "docs/JAMIA/comparisons/TM_DFB" },
  { label: "TM", path: `${BASE}/TM_snippets.json`, outDir: "docs/JAMIA/comparisons/TM" },
];

function summarizeBug(s: Record<string, unknown>): string {
  const text = String(s.question_text ?? "").slice(0, 300);
  const title = String(s.title ?? "");
  const ansText = String(s.top_answer_text ?? "").slice(0, 200);

  // Try to extract the core problem from the question + answer
  // This is a best-effort one-liner
  const lines: string[] = [];

  // From the title
  lines.push(title);

  // From the answer — usually explains the root cause concisely
  if (ansText) {
    // Take first sentence of answer
    const firstSentence = ansText.split(/\.\s/)[0];
    if (firstSentence && firstSentence.length > 10) {
      lines.push(firstSentence);
    }
  }

  return lines.join(" — ");
}

function shouldProbe(s: Record<string, unknown>): { verdict: string; reason: string } {
  const tags = Array.isArray(s.tags) ? s.tags as string[] : [];
  const bug = String(s.bug);
  const effect = String(s.effect);
  const title = String(s.title).toLowerCase();
  const qText = String(s.question_text).toLowerCase();
  const aText = String(s.top_answer_text).toLowerCase();

  // DataFrame-relevant tags
  const dfTags = ["pandas", "dataframe", "data.table", "dplyr", "tidyr", "tidyverse", "data-manipulation"];
  const hasDfTag = tags.some(t => dfTags.includes(t));

  // Type-system catchable patterns
  const typePatterns = [
    "dtype", "astype", "type mismatch", "typeerror", "type error",
    "object dtype", "string to numeric", "numeric to string",
    "int vs float", "integer vs double", "column type",
    "merge", "join", "groupby", "group_by", "summarize", "summarise",
    "pivot", "melt", "reshape", "select", "rename", "drop",
    "keyerror", "column not found", "no attribute", "missing column",
    "nan", "null", "na ", "missing value", "fillna",
  ];
  const hasTypePattern = typePatterns.some(p =>
    title.includes(p) || qText.includes(p) || aText.includes(p)
  );

  // Non-probe patterns
  const skipPatterns = [
    "matplotlib", "plot", "ggplot", "visualization", "chart",
    "display", "rendering", "css", "html", "selenium",
    "scikit", "sklearn", "machine learning", "neural",
    "tensorflow", "keras", "torch",
  ];
  const hasSkipPattern = skipPatterns.some(p =>
    title.includes(p) || tags.some(t => t.includes(p))
  );

  if (hasSkipPattern && !hasDfTag) {
    return { verdict: "No", reason: "Visualization/ML — not type-system catchable" };
  }

  if (bug === "DFB" && hasTypePattern) {
    return { verdict: "Yes", reason: "DataFrame type bug with type-catchable pattern" };
  }

  if (hasDfTag && hasTypePattern) {
    return { verdict: "Yes", reason: "DataFrame operation with type-relevant issue" };
  }

  if (bug === "DFB") {
    return { verdict: "Maybe", reason: "DataFrame bug — needs manual review" };
  }

  if (hasTypePattern) {
    return { verdict: "Maybe", reason: "Has type-relevant pattern but not clearly DataFrame" };
  }

  return { verdict: "No", reason: "Not clearly type-system catchable" };
}

for (const ds of datasets) {
  const raw: Record<string, unknown>[] = JSON.parse(await Deno.readTextFile(ds.path));

  // Sort: Python first, then R, then by score desc
  raw.sort((a, b) => {
    if (a.lang !== b.lang) return a.lang === "Python" ? -1 : 1;
    return (b.score as number) - (a.score as number);
  });

  const lines: string[] = [];
  lines.push(`# ${ds.label} — Issue Catalog`);
  lines.push("");
  lines.push(`Source: RPython dataset (ESEC/FSE 2023) — ${raw.length} StackOverflow bugs`);
  lines.push("");

  // Summary counts
  const yesCount = raw.filter(s => shouldProbe(s).verdict === "Yes").length;
  const maybeCount = raw.filter(s => shouldProbe(s).verdict === "Maybe").length;
  const noCount = raw.filter(s => shouldProbe(s).verdict === "No").length;
  lines.push(`**Probe candidates:** ${yesCount} Yes, ${maybeCount} Maybe, ${noCount} No`);
  lines.push("");

  // Table
  lines.push("| # | Lang | Score | Bug | Effect | Title | Problem | Probe? | Reason | Done? |");
  lines.push("|---|------|-------|-----|--------|-------|---------|--------|--------|-------|");

  raw.forEach((s, i) => {
    const { verdict, reason } = shouldProbe(s);
    const title = String(s.title)
      .replace(/&quot;/g, '"')
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&#39;/g, "'")
      .replace(/\|/g, "\\|");

    // Concise problem description from answer
    const ansText = String(s.top_answer_text ?? "");
    const firstSentence = ansText.split(/\.\s/)[0]?.slice(0, 80) ?? "";
    const problem = firstSentence.replace(/\|/g, "\\|").replace(/\n/g, " ");

    const url = String(s.url);
    const titleLink = `[${title.slice(0, 60)}${title.length > 60 ? "..." : ""}](${url})`;

    lines.push(
      `| ${i + 1} | ${s.lang} | ${s.score} | ${s.bug} | ${s.effect} | ${titleLink} | ${problem} | ${verdict} | ${reason} | |`
    );
  });

  // Ensure output dir exists
  await Deno.mkdir(ds.outDir, { recursive: true });
  const outPath = `${ds.outDir}/issues.md`;
  await Deno.writeTextFile(outPath, lines.join("\n") + "\n");
  console.log(`Wrote ${outPath} (${raw.length} rows)`);
}
