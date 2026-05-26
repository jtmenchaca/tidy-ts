/** SVG leaf pill height — shared by `NetworkNode` and viewBox sizing in `NetworkGraph`. */
export const LEAF_PILL_HEIGHT = { withSubtitle: 24, noSubtitle: 18 } as const;

export function leafPillHalfHeight({ subtitle }: { subtitle: string }): number {
  return (subtitle ? LEAF_PILL_HEIGHT.withSubtitle : LEAF_PILL_HEIGHT.noSubtitle) / 2;
}
