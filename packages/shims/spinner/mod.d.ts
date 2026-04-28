/**
 * Animation picker for CLI spinners.
 *
 * Selects a fullscreen animation by name, or picks one at random.
 */
import type { Spinner } from "./spinner.ts";
export type AnimationName = "aquarium" | "matrix" | "nyan";
export declare function createAnimatedSpinner(initialMessage: string, animation?: AnimationName): Spinner | null;
