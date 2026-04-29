/**
 * Shared fade-in / fade-out transition for fullscreen terminal animations.
 *
 * Uses Unicode block-shade characters to simulate a dissolve effect:
 * fade-in:  ████ → ▓▓▓▓ → ▒▒▒▒ → ░░░░ → (clear)
 * fade-out: (clear) → ░░░░ → ▒▒▒▒ → ▓▓▓▓ → ████ → (clear screen)
 */

import process from "node:process";
import { clearInterval as nodeClearInterval, setInterval as nodeSetInterval } from "node:timers";

const SHADES_IN = ["\u2588", "\u2593", "\u2592", "\u2591"];
const SHADES_OUT = ["\u2591", "\u2592", "\u2593", "\u2588"];
const FRAME_MS = 30;

function fillScreen(char: string, cols: number, rows: number) {
  const line = char.repeat(cols);
  let out = "\x1b[H";
  for (let r = 0; r < rows; r++) {
    out += line + (r < rows - 1 ? "\n" : "");
  }
  process.stdout.write(out);
}

export function fadeIn(cols: number, rows: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve) => {
    if (signal?.aborted) { resolve(); return; }
    let i = 0;
    const iv = nodeSetInterval(() => {
      if (signal?.aborted || i >= SHADES_IN.length) {
        nodeClearInterval(iv);
        if (!signal?.aborted) process.stdout.write("\x1b[2J\x1b[H");
        resolve();
        return;
      }
      fillScreen(SHADES_IN[i], cols, rows);
      i++;
    }, FRAME_MS);
    iv.unref();
    signal?.addEventListener("abort", () => {
      nodeClearInterval(iv);
      resolve();
    }, { once: true });
  });
}

export function fadeOut(cols: number, rows: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve) => {
    if (signal?.aborted) { resolve(); return; }
    let i = 0;
    const iv = nodeSetInterval(() => {
      if (signal?.aborted || i >= SHADES_OUT.length) {
        nodeClearInterval(iv);
        if (!signal?.aborted) process.stdout.write("\x1b[2J\x1b[H");
        resolve();
        return;
      }
      fillScreen(SHADES_OUT[i], cols, rows);
      i++;
    }, FRAME_MS);
    iv.unref();
    signal?.addEventListener("abort", () => {
      nodeClearInterval(iv);
      resolve();
    }, { once: true });
  });
}
