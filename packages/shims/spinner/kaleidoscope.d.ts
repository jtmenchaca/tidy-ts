/**
 * Kaleidoscope animation for the terminal.
 *
 * Computes a pattern in polar coordinates from center, then mirrors it
 * across multiple axes to create a rotating, symmetrical kaleidoscope.
 * Wave parameters are randomized on each run so it always looks different.
 */
import type { Spinner } from "./spinner.ts";
export declare function createKaleidoscopeSpinner(initialMessage: string): Spinner | null;
