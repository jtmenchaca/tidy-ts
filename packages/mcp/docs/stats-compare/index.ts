// Re-exports all stats-compare docs
export { oneGroupDocs } from "./one-group.ts";
export { twoGroupsDocs } from "./two-groups.ts";
export { multiGroupsDocs } from "./multi-groups.ts";

// Aggregate all for easy import
import { oneGroupDocs } from "./one-group.ts";
import { twoGroupsDocs } from "./two-groups.ts";
import { multiGroupsDocs } from "./multi-groups.ts";

export const statsCompareDocs = {
  ...oneGroupDocs,
  ...twoGroupsDocs,
  ...multiGroupsDocs,
};
