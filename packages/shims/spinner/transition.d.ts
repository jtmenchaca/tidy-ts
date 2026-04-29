/**
 * Shared fade-in / fade-out transition for fullscreen terminal animations.
 *
 * Uses Unicode block-shade characters to simulate a dissolve effect:
 * fade-in:  ████ → ▓▓▓▓ → ▒▒▒▒ → ░░░░ → (clear)
 * fade-out: (clear) → ░░░░ → ▒▒▒▒ → ▓▓▓▓ → ████ → (clear screen)
 */
export declare function fadeIn(cols: number, rows: number, signal?: AbortSignal): Promise<void>;
export declare function fadeOut(cols: number, rows: number, signal?: AbortSignal): Promise<void>;
