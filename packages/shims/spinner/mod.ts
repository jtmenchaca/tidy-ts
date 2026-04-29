/**
 * Animation picker for CLI spinners.
 *
 * Selects a fullscreen animation by name, or picks one at random.
 */

import type { Spinner } from "./spinner.ts";
import { createAquariumSpinner } from "./aquarium.ts";
import { createInvadersSpinner } from "./invaders.ts";
import { createKaleidoscopeSpinner } from "./kaleidoscope.ts";
import { createMatrixSpinner } from "./matrix.ts";
import { createNyanSpinner } from "./nyan.ts";

type AnimationFactory = (message: string) => Spinner | null;

const ANIMATIONS: Record<string, AnimationFactory> = {
  aquarium: createAquariumSpinner,
  invaders: createInvadersSpinner,
  kaleidoscope: createKaleidoscopeSpinner,
  matrix: createMatrixSpinner,
  nyan: createNyanSpinner,
};

/** Animations included in the random rotation. */
const RANDOM_POOL = ["aquarium", "invaders", "matrix", "nyan"];

export type AnimationName = "aquarium" | "invaders" | "kaleidoscope" | "matrix" | "nyan";

export function createAnimatedSpinner(
  initialMessage: string,
  animation?: AnimationName,
): Spinner | null {
  if (animation && animation in ANIMATIONS) {
    return ANIMATIONS[animation](initialMessage);
  }

  // Random pick from the pool
  const name = RANDOM_POOL[Math.floor(Math.random() * RANDOM_POOL.length)];
  return ANIMATIONS[name](initialMessage);
}
