/**
 * Shared harness for fullscreen terminal animations.
 *
 * Each animation provides init/step/render functions and an interval.
 * The harness handles all the boilerplate: TTY detection, cursor visibility,
 * fade transitions, console.log buffering, resize handling, and the Spinner API.
 */
import { setInterval as nodeSetInterval } from "node:timers";
import type { Spinner } from "./spinner.ts";
/** Braille spinner frames shared by all animations' status lines. */
export declare const SPIN: string[];
/** Base state fields every animation gets for free. */
export interface BaseState {
    frame: number;
    cols: number;
    rows: number;
    message: string;
    stopped: boolean;
    interval: ReturnType<typeof nodeSetInterval> | null;
    originalLog: typeof console.log;
    logBuffer: string[];
}
/** Create base state fields. Override `rows` in the animation's own init if needed. */
export declare function createBaseState(message: string, reserveRows: number): BaseState;
/** Definition that each animation must provide. */
export interface AnimationConfig<S extends BaseState> {
    /** Create initial state (should call createBaseState internally). */
    init(message: string): S;
    /** Advance simulation by one tick. */
    step(state: S): void;
    /** Render current state to stdout. */
    render(state: S): void;
    /** Milliseconds between ticks. */
    intervalMs: number;
    /** How many terminal rows to reserve below the animation (for border, status, etc.). */
    reserveRows: number;
}
/** Wire up an AnimationConfig into a full Spinner with all the shared plumbing. */
export declare function createAnimationSpinner<S extends BaseState>(config: AnimationConfig<S>, initialMessage: string): Spinner | null;
