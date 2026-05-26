// Re-exports all dataframe docs
export { creationDocs } from "./creation.ts";
export { displayDocs } from "./display.ts";
export { selectionDocs } from "./selection.ts";
export { transformationDocs } from "./transformation.ts";
export { groupingDocs } from "./grouping.ts";
export { extractionDocs } from "./extraction.ts";
export { joinsDocs } from "./joins.ts";
export { reshapingDocs } from "./reshaping.ts";
export { timeSeriesDocs } from "./time-series.ts";
export { missingDataDocs } from "./missing-data.ts";
export { setupDocs } from "./setup.ts";
export { performanceDocs } from "./performance.ts";

// Aggregate all for easy import
import { creationDocs } from "./creation.ts";
import { displayDocs } from "./display.ts";
import { selectionDocs } from "./selection.ts";
import { transformationDocs } from "./transformation.ts";
import { groupingDocs } from "./grouping.ts";
import { extractionDocs } from "./extraction.ts";
import { joinsDocs } from "./joins.ts";
import { reshapingDocs } from "./reshaping.ts";
import { timeSeriesDocs } from "./time-series.ts";
import { missingDataDocs } from "./missing-data.ts";
import { setupDocs } from "./setup.ts";
import { performanceDocs } from "./performance.ts";

export const dataframeDocs = {
  ...creationDocs,
  ...displayDocs,
  ...selectionDocs,
  ...transformationDocs,
  ...groupingDocs,
  ...extractionDocs,
  ...joinsDocs,
  ...reshapingDocs,
  ...timeSeriesDocs,
  ...missingDataDocs,
  ...setupDocs,
  ...performanceDocs,
};
