// Runtime-side wrapper around the topology-template module's pure
// placeholder substitution. Calls the same regex/grammar but raises the
// runtime's `InputValidationError` when a placeholder is missing from
// the resolved node input. Same template grammar across the runner and
// `validateTopology`.

import { renderPromptTemplate } from "../../topology/template.ts";
import { InputValidationError } from "../errors.ts";

export function renderTemplate(
  template: string,
  input: Record<string, unknown>,
): string {
  return renderPromptTemplate(template, input, (key) => {
    throw new InputValidationError({
      message: `Prompt placeholder {{${key}}} is missing from input.`,
    });
  });
}
