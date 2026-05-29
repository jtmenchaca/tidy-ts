// MapNode / ParallelMapNode shared reducer. Walks per-item outputs and
// applies the declared `reducers` map to each outer output title.
//
// Each reducer entry is `{ from, method }`:
//   - `from` is the per-iteration subflow output key whose values we collect.
//   - `method` is how to combine them (`append` | `sum` | `average` | `max` | `min`).
//
// When `reducers` is omitted, falls back to "same name, append" for every
// declared output title (or every key of the first per-item record).

import type { ReducerSpec } from "../../topology/nodes/map.ts";

export function reduceMapResults(
  perItem: Record<string, unknown>[],
  reducers: Record<string, ReducerSpec> | undefined,
  declaredOutputs: { title: string }[] | undefined,
): Record<string, unknown> {
  if (perItem.length === 0) return {};

  const outputTitles = declaredOutputs && declaredOutputs.length > 0
    ? declaredOutputs.map((p) => p.title)
    : Object.keys(perItem[0]);

  const out: Record<string, unknown> = {};
  for (const title of outputTitles) {
    const spec = reducers?.[title];
    const sourceKey = spec?.from ?? title;
    const method = spec?.method ?? "append";
    const values = perItem
      .map((r) => r[sourceKey])
      .filter((v) => v !== undefined);
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
