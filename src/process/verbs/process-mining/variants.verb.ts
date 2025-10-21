/**
 * Get process variants (unique trace sequences)
 */

import type { XESTrace } from "../../readXES.ts";
import { analyzeVariants } from "../../analysis/performance/variant-analysis.ts";

export function variants() {
  return (traces: readonly XESTrace[]): Map<string, number> => {
    const result = analyzeVariants({ traces: [...traces], attributes: {} });

    // Convert the result back to the expected Map format
    const variants = new Map<string, number>();

    // Add the most common variant
    variants.set(
      result.mostCommonVariant.sequence,
      result.mostCommonVariant.count,
    );

    // Add rare variants
    for (const variant of result.rareVariants) {
      variants.set(variant.sequence, variant.count);
    }

    return variants;
  };
}
