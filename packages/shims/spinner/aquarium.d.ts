/**
 * ASCII aquarium animation for the terminal.
 *
 * Renders fish swimming back and forth with rising bubbles across the full
 * terminal window. Displayed during long-running CLI operations to keep
 * things entertaining.
 */
import type { Spinner } from "./spinner.ts";
export declare function createAquariumSpinner(initialMessage: string): Spinner | null;
