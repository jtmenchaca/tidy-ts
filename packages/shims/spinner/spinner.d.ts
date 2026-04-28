/**
 * CLI spinner with optional fullscreen animations.
 *
 * Provides visual feedback during long-running operations. In TTY mode,
 * randomly selects a fullscreen animation (aquarium, matrix rain, nyan cat).
 * In non-TTY mode (CI, piped output), falls back to simple line-by-line logging.
 *
 * Usage:
 *   createSpinner("Loading...")              → random animation
 *   createSpinner("Loading...", "aquarium")  → fish tank
 *   createSpinner("Loading...", "matrix")    → digital rain
 *   createSpinner("Loading...", "nyan")      → nyan cat
 *   createSpinner("Loading...", "simple")    → classic single-line spinner
 */
import { type AnimationName } from "./mod.ts";
export type SpinnerStyle = AnimationName | "simple";
export interface Spinner {
    /** Replace the current spinner text (e.g. "Downloading..." -> "Parsing..."). */
    update(message: string): void;
    /** Print a normal log line while preserving spinner rendering. */
    log(message: string): void;
    /** Stop animation, restore console behavior, and print final status line. Await for fade-out. */
    stop(message: string): void | Promise<void>;
}
export declare function createSpinner(initialMessage: string, style?: SpinnerStyle): Spinner;
export declare function withSpinner<T>(message: string, fn: (spinner: Spinner) => Promise<T>, style?: SpinnerStyle): Promise<T>;
