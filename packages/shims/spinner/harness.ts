/**
 * Shared harness for fullscreen terminal animations.
 *
 * Each animation provides init/step/render functions and an interval.
 * The harness handles all the boilerplate: TTY detection, cursor visibility,
 * fade transitions, console.log buffering, resize handling, and the Spinner API.
 */

import process from "node:process";
import type { Spinner } from "./spinner.ts";
import { fadeIn, fadeOut } from "./transition.ts";

/** Braille spinner frames shared by all animations' status lines. */
export const SPIN = ["\u280B", "\u2819", "\u2839", "\u2838", "\u283C", "\u2834", "\u2826", "\u2827", "\u2807", "\u280F"];

/** Base state fields every animation gets for free. */
export interface BaseState {
  frame: number;
  cols: number;
  rows: number;
  message: string;
  stopped: boolean;
  interval: ReturnType<typeof setInterval> | null;
  originalLog: typeof console.log;
  logBuffer: string[];
}

/** Read terminal dimensions, reserving `reserveRows` at the bottom. */
function termSize(reserveRows: number): { cols: number; rows: number } {
  const cols = process.stdout.columns || 80;
  const rows = Math.max((process.stdout.rows || 24) - reserveRows, 8);
  return { cols, rows };
}

/** Create base state fields. Override `rows` in the animation's own init if needed. */
export function createBaseState(message: string, reserveRows: number): BaseState {
  const { cols, rows } = termSize(reserveRows);
  return {
    frame: 0,
    cols,
    rows,
    message,
    stopped: false,
    interval: null,
    originalLog: console.log,
    logBuffer: [],
  };
}

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
export function createAnimationSpinner<S extends BaseState>(
  config: AnimationConfig<S>,
  initialMessage: string,
): Spinner | null {
  const isTTY = process.stdout.isTTY ?? false;
  if (!isTTY) return null;

  const s = config.init(initialMessage);
  s.originalLog = console.log;

  process.stdout.write("\x1b[?25l");
  const cols = process.stdout.columns || 80;
  const termRows = process.stdout.rows || 24;

  fadeIn(cols, termRows).then(() => {
    if (s.stopped) return;
    s.interval = setInterval(() => {
      if (s.stopped) return;
      config.step(s);
      config.render(s);
    }, config.intervalMs);
  });

  console.log = (...args: unknown[]) => {
    if (s.stopped) {
      s.originalLog(...args);
      return;
    }
    s.logBuffer.push(
      args.map((a) => (typeof a === "string" ? a : String(a))).join(" "),
    );
  };

  const onResize = () => {
    if (s.stopped) return;
    const size = termSize(config.reserveRows);
    s.cols = size.cols;
    s.rows = size.rows;
    process.stdout.write("\x1b[2J");
  };
  process.stdout.on("resize", onResize);

  return {
    update(msg: string) {
      s.message = msg;
    },
    log(msg: string) {
      s.logBuffer.push(msg);
    },
    async stop(msg: string) {
      s.stopped = true;
      if (s.interval) clearInterval(s.interval);
      process.stdout.removeListener("resize", onResize);
      console.log = s.originalLog;

      const c = process.stdout.columns || 80;
      const r = process.stdout.rows || 24;
      await fadeOut(c, r);
      process.stdout.write("\x1b[?25h");
      for (const line of s.logBuffer) {
        s.originalLog(line);
      }
      s.originalLog(msg);
    },
  };
}
