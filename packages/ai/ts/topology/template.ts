// Prompt-template placeholder grammar.
//
// `Agent.systemPromptTemplate` references input fields with
// `{{ name }}` (whitespace optional). The runner
// substitutes them at execution time; `validateTopology` checks at
// authoring time that every placeholder corresponds to a declared input.
//
// One regex, one grammar — kept here so the runtime renderer and the
// authoring-time validator can't drift.

/** Matches `{{ identifier }}` with optional inner whitespace. Capture
 *  group 1 is the bare identifier. Identifiers follow JS-name rules
 *  (letter or `_`/`$` start, then word chars). */
export const PROMPT_PLACEHOLDER_REGEX = /\{\{\s*([a-zA-Z_$][\w$]*)\s*\}\}/g;

/** Enumerate every placeholder identifier in `template`, in source order
 *  (duplicates included). */
export function extractPromptPlaceholders(template: string): string[] {
  const out: string[] = [];
  for (const m of template.matchAll(PROMPT_PLACEHOLDER_REGEX)) out.push(m[1]);
  return out;
}

/** Substitute placeholders by name from `input`. The `missing` callback
 *  fires when a placeholder isn't present in `input` — runtime callers
 *  throw `InputValidationError`, but the lookup itself shouldn't know
 *  about the runtime error type. Non-string values are JSON-stringified. */
export function renderPromptTemplate(
  template: string,
  input: Record<string, unknown>,
  missing: (key: string) => never,
): string {
  return template.replace(PROMPT_PLACEHOLDER_REGEX, (_m, key) => {
    if (!(key in input)) missing(key);
    const v = input[key as keyof typeof input];
    return typeof v === "string" ? v : JSON.stringify(v);
  });
}
