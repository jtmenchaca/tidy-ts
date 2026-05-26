// MapNode / ParallelMapNode shared reducer. Walks per-item outputs and
// applies the declared `reducers` map (`append` | `sum` | `average` |
// `max` | `min`) to each output title; defaults to `append` when the
// reducer for a key isn't specified.

import type { ReductionMethod } from "../../topology/nodes/map.ts";

export function reduceMapResults(
  perItem: Record<string, unknown>[],
  reducers: Record<string, ReductionMethod> | undefined,
  declaredOutputs: { title: string }[] | undefined,
): Record<string, unknown> {
  if (perItem.length === 0) return {};

  const outputTitles = declaredOutputs && declaredOutputs.length > 0
    ? declaredOutputs.map((p) => p.title)
    : Object.keys(perItem[0]);

  const out: Record<string, unknown> = {};
  for (const title of outputTitles) {
    const values = perItem.map((r) => r[title]).filter((v) => v !== undefined);
    const method = reducers?.[title] ?? "append";
    switch (method) {
      case "append":
        out[title] = values;
        break;
      case "sum":
        out[title] = (values as number[]).reduce((a, b) => a + b, 0);
        break;
      case "average": {
        const sum = (values as number[]).reduce((a, b) => a + b, 0);
        out[title] = values.length > 0 ? sum / values.length : 0;
        break;
      }
      case "max":
        out[title] = Math.max(...(values as number[]));
        break;
      case "min":
        out[title] = Math.min(...(values as number[]));
        break;
    }
  }
  return out;
}
