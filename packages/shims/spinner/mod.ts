/**
 * Animation picker for CLI spinners.
 *
 * Selects a fullscreen animation by name, or picks one at random.
 */

import type { Spinner } from "./spinner.ts";
import { createAquariumSpinner } from "./aquarium.ts";
import { createMatrixSpinner } from "./matrix.ts";
import { createNyanSpinner } from "./nyan.ts";

type AnimationFactory = (message: string) => Spinner | null;

const ANIMATIONS: Record<string, AnimationFactory> = {
  aquarium: createAquariumSpinner,
  matrix: createMatrixSpinner,
  nyan: createNyanSpinner,
};

const ANIMATION_NAMES = Object.keys(ANIMATIONS);

export type AnimationName = "aquarium" | "matrix" | "nyan";

export function createAnimatedSpinner(
  initialMessage: string,
  animation?: AnimationName,
): Spinner | null {
  if (animation && animation in ANIMATIONS) {
    return ANIMATIONS[animation](initialMessage);
  }

  // Random pick
  const name = ANIMATION_NAMES[Math.floor(Math.random() * ANIMATION_NAMES.length)];
  return ANIMATIONS[name](initialMessage);
}
