// Re-exports all string docs
export { strDocs } from "./str.ts";

// Aggregate all for easy import
import { strDocs } from "./str.ts";

export const stringDocs = {
  ...strDocs,
};
