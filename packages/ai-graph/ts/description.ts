import type { DescriptionSentence, VisualNode } from "./types.ts";

/** One prose sentence plus BibTeX-style citation keys that must exist in graph metadata `references`. */
export function sentence({ text, references }: { text: string; references?: string[] }): DescriptionSentence {
  return { text, references: references ?? [] };
}

/** Plain text (sentences joined with spaces), no citation keys. */
export function flattenDescription({ description }: { description: DescriptionSentence[] }): string {
  return description.map((s) => s.text).join(" ");
}

/** Id/label/subtitle-style search across body text plus all citation keys. */
export function searchBlobFromDescription({ description }: { description: DescriptionSentence[] }): string {
  const texts = description.map((s) => s.text);
  const keys = description.flatMap((s) => s.references);
  return [...texts, ...keys].join(" ");
}

/**
 * Parse JGF / API `description` metadata (array of { text, references? }) into typed sentences.
 */
export function parseDescriptionSentences({ raw }: { raw: unknown }): DescriptionSentence[] {
  if (!Array.isArray(raw)) return [];
  const sentences: DescriptionSentence[] = [];
  for (const x of raw) {
    if (x === null || typeof x !== "object") continue;
    if (!("text" in x)) continue;
    const t = x.text;
    if (typeof t !== "string") continue;
    let references: string[] = [];
    if ("references" in x && Array.isArray(x.references)) {
      references = x.references.filter((r: unknown): r is string => typeof r === "string");
    }
    sentences.push({ text: t, references });
  }
  return sentences;
}

function citationDisplayLine({ key, references }: { key: string; references: Record<string, unknown> }): string {
  const entry = references[key];
  if (entry !== null && typeof entry === "object" && "title" in entry) {
    const title = Reflect.get(entry, "title");
    if (typeof title === "string" && title.length > 0) {
      return `[${key}] ${title}`;
    }
  }
  return `[${key}]`;
}

/**
 * Multiline string: each sentence, then indented citation lines (key and optional title from `references`).
 */
export function formatDescriptionWithCitations({
  description,
  references,
}: {
  description: DescriptionSentence[];
  references: Record<string, unknown>;
}): string {
  const blocks: string[] = [];
  for (const line of description) {
    const citeLines = line.references.map((key) =>
      `  ${citationDisplayLine({ key, references })}`
    );
    if (citeLines.length > 0) {
      blocks.push([line.text, ...citeLines].join("\n"));
    } else {
      blocks.push(line.text);
    }
  }
  return blocks.join("\n\n");
}

/**
 * Ensures every citation key on every sentence exists in `references`.
 * Returns human-readable issues; empty array means all keys resolve.
 */
export function validateDescriptionReferences({
  nodes,
  references,
}: {
  nodes: VisualNode[];
  /** Citation keys are the keys of this map (e.g. graph.metadata.references). */
  references: Record<string, unknown>;
}): string[] {
  const keys = new Set(Object.keys(references));
  const issues: string[] = [];

  for (const node of nodes) {
    node.description.forEach((line, lineIndex) => {
      for (const refKey of line.references) {
        if (!keys.has(refKey)) {
          issues.push(
            `Node "${node.id}" description line ${lineIndex + 1}: unknown reference key "${refKey}" (not in graph.metadata.references)`,
          );
        }
      }
    });
  }

  return issues;
}
