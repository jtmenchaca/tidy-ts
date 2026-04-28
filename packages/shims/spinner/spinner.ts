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

import process from "node:process";
import { type AnimationName, createAnimatedSpinner } from "./mod.ts";

const FRAMES = ["\u280B", "\u2819", "\u2839", "\u2838", "\u283C", "\u2834", "\u2826", "\u2827", "\u2807", "\u280F"];

export type SpinnerStyle = AnimationName | "simple";

export interface Spinner {
  /** Replace the current spinner text (e.g. "Downloading..." -> "Parsing..."). */
  update(message: string): void;
  /** Print a normal log line while preserving spinner rendering. */
  log(message: string): void;
  /** Stop animation, restore console behavior, and print final status line. Await for fade-out. */
  stop(message: string): void | Promise<void>;
}

export function createSpinner(initialMessage: string, style?: SpinnerStyle): Spinner {
  const isTTY = process.stdout.isTTY ?? false;

  // In TTY mode, use a fullscreen animation by default.
  // Pass "simple" to get the classic single-line spinner.
  if (isTTY && style !== "simple") {
    const animated = createAnimatedSpinner(
      initialMessage,
      style as AnimationName | undefined,
    );
    if (animated) return animated;
  }

  let frame = 0;
  let message = initialMessage;
  let stopped = false;

  function write(text: string) {
    process.stdout.write(text);
  }

  function clearLine() {
    if (isTTY) write("\r\x1b[K");
  }

  const interval = isTTY
    ? setInterval(() => {
        if (stopped) return;
        write(`\r${FRAMES[frame % FRAMES.length]} ${message}`);
        frame++;
      }, 80)
    : null;

  function redraw() {
    if (isTTY && !stopped) {
      write(`\r${FRAMES[frame % FRAMES.length]} ${message}`);
    }
  }

  const originalLog = console.log;
  console.log = (...args: unknown[]) => {
    if (stopped) {
      originalLog(...args);
      return;
    }
    clearLine();
    originalLog(...args);
    redraw();
  };

  if (!isTTY) {
    originalLog(`  ${initialMessage}`);
  }

  return {
    update(msg: string) {
      message = msg;
      if (!isTTY) {
        originalLog(`  ${msg}`);
      }
    },
    log(msg: string) {
      clearLine();
      originalLog(msg);
      redraw();
    },
    stop(msg: string) {
      stopped = true;
      if (interval) clearInterval(interval);
      console.log = originalLog;
      if (isTTY) {
        write(`\r\x1b[K${msg}\n`);
      } else {
        originalLog(msg);
      }
    },
  };
}

export async function withSpinner<T>(
  message: string,
  fn: (spinner: Spinner) => Promise<T>,
  style?: SpinnerStyle,
): Promise<T> {
  const spinner = createSpinner(message, style);
  try {
    const result = await fn(spinner);
    return result;
  } catch (err) {
    await spinner.stop(`\u2717 ${message} \u2014 failed`);
    throw err;
  }
}
