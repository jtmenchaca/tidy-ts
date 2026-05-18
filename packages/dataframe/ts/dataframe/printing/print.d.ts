import type { PrintOptions } from "../implementation/create-dataframe.ts";
/** Build toMarkdown printer bound to the specific store instance */
export declare function buildToMarkdown(store: readonly object[]): (opts?: PrintOptions) => string;
