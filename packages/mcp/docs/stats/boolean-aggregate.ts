import type { DocEntry } from "../mcp-types.ts";

export const booleanAggregateDocs: Record<string, DocEntry> = {
  any: {
    name: "s.any",
    category: "stats",
    signature:
      "s.any(value: boolean): boolean\ns.any(values: readonly boolean[] | boolean[], options?: { removeNull?: boolean; removeUndefined?: boolean }): boolean\ns.any(values: (boolean | null | undefined)[] | readonly (boolean | null | undefined)[], options?: { removeNull?: boolean; removeUndefined?: boolean }): boolean | null\n// Additional overloads when removeNull/removeUndefined narrow nulls — packages/dataframe/ts/stats/aggregate/any.ts",
    description:
      "True if any boolean in the array is true. False if all are false. Returns null for an empty array or when null/undefined appear without matching removal flags.",
    imports: ['import { stats as s } from "@tidy-ts/dataframe";'],
    parameters: [
      "value: Single boolean",
      "values: Boolean array or readonly array; may include null/undefined with removal options",
      "options.removeNull / removeUndefined: Skip those entries when true",
    ],
    returns: "boolean, or boolean | null for nullable arrays without full removal flags",
    examples: [
      "s.any(true) // true",
      "s.any([true, false, false]) // true",
      "s.any([false, false]) // false",
      "s.any([]) // null",
      "s.any([null, true], { removeNull: true }) // true",
    ],
    related: ["all", "sum"],
  },

  all: {
    name: "s.all",
    category: "stats",
    signature:
      "s.all(value: boolean): boolean\ns.all(values: readonly boolean[] | boolean[], options?: { removeNull?: boolean; removeUndefined?: boolean }): boolean\ns.all(values: (boolean | null | undefined)[] | readonly (boolean | null | undefined)[], options?: { removeNull?: boolean; removeUndefined?: boolean }): boolean | null\n// Additional overloads when removeNull/removeUndefined narrow nulls — packages/dataframe/ts/stats/aggregate/all.ts",
    description:
      "True if every boolean in the array is true. False if any is false. Returns null for an empty array or when null/undefined appear without matching removal flags.",
    imports: ['import { stats as s } from "@tidy-ts/dataframe";'],
    parameters: [
      "value: Single boolean",
      "values: Boolean array or readonly array; may include null/undefined with removal options",
      "options.removeNull / removeUndefined: Skip those entries when true",
    ],
    returns: "boolean, or boolean | null for nullable arrays without full removal flags",
    examples: [
      "s.all(true) // true",
      "s.all([true, true, true]) // true",
      "s.all([true, false, true]) // false",
      "s.all([]) // null",
      "s.all([null, true], { removeNull: true }) // true",
    ],
    related: ["any", "sum"],
  },
};
