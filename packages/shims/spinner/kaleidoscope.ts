/**
 * Kaleidoscope animation for the terminal.
 *
 * Computes a pattern in polar coordinates from center, then mirrors it
 * across multiple axes to create a rotating, symmetrical kaleidoscope.
 * Wave parameters are randomized on each run so it always looks different.
 */

import process from "node:process";
import type { Spinner } from "./spinner.ts";
import {
  type AnimationConfig,
  type BaseState,
  createAnimationSpinner,
  createBaseState,
  SPIN,
} from "./harness.ts";

// ── Visual ───────────────────────────────────────────────────────────────

const CHARS = [" ", "\u2591", "\u2592", "\u2593", "\u2588", "\u2593", "\u2592", "\u2591"];

// 256-color rainbow palette
const PALETTE = [
  196, 202, 208, 214, 220, 226, // red → yellow
  190, 154, 118, 82, 46,        // yellow → green
  47, 48, 49, 50, 51,           // green → cyan
  45, 39, 33, 27, 21,           // cyan → blue
  57, 93, 129, 165, 201,        // blue → magenta
  200, 199, 198, 197,           // magenta → red
];

// ── Randomized wave parameters ───────────────────────────────────────────

interface WaveParams {
  distFreq: number;
  timeSpeed: number;
  angleMult: number;
}

function randomWave(): WaveParams {
  return {
    distFreq: 0.15 + Math.random() * 0.4,
    timeSpeed: 0.5 + Math.random() * 2.5,
    angleMult: 1 + Math.floor(Math.random() * 6),
  };
}

// ── State ────────────────────────────────────────────────────────────────

interface State extends BaseState {
  t: number;
  symmetry: number;
  waves: [WaveParams, WaveParams, WaveParams];
  colorDistScale: number;
  colorTimeSpeed: number;
  colorAngleScale: number;
  dt: number;
}

function init(msg: string): State {
  const base = createBaseState(msg, 2);
  return {
    ...base,
    t: 0,
    symmetry: [4, 5, 6, 8, 10, 12][Math.floor(Math.random() * 6)],
    waves: [randomWave(), randomWave(), randomWave()],
    colorDistScale: 0.15 + Math.random() * 0.3,
    colorTimeSpeed: 1.5 + Math.random() * 3,
    colorAngleScale: 1 + Math.random() * 3,
    dt: 0.02 + Math.random() * 0.03,
  };
}

// ── Simulation ───────────────────────────────────────────────────────────

function step(s: State) {
  s.frame++;
  s.t += s.dt;
}

// ── Rendering ────────────────────────────────────────────────────────────

function render(s: State) {
  const { cols, rows, t, symmetry, waves, colorDistScale, colorTimeSpeed, colorAngleScale } = s;

  const cx = cols / 2;
  const cy = rows / 2;
  const wedge = (Math.PI * 2) / symmetry;

  const lines: string[] = [];
  let lastColor = -1;

  for (let r = 0; r < rows; r++) {
    let line = "";

    for (let c = 0; c < cols; c++) {
      const dx = (c - cx) * 0.5;
      const dy = (r - cy);
      const dist = Math.sqrt(dx * dx + dy * dy);
      let angle = Math.atan2(dy, dx);

      // Fold into wedge + mirror
      angle = ((angle % wedge) + wedge) % wedge;
      if (angle > wedge / 2) angle = wedge - angle;

      // Sum 3 randomized interference waves
      const [w1, w2, w3] = waves;
      const v1 = Math.sin(dist * w1.distFreq - t * w1.timeSpeed + angle * w1.angleMult);
      const v2 = Math.sin(dist * w2.distFreq + t * w2.timeSpeed - angle * w2.angleMult);
      const v3 = Math.cos(dist * w3.distFreq - t * w3.timeSpeed + angle * w3.angleMult);
      const pattern = (v1 + v2 + v3) / 3;

      const charIdx = Math.floor(((pattern + 1) / 2) * CHARS.length) % CHARS.length;
      const ch = CHARS[charIdx];

      const colorIdx = Math.floor(
        ((dist * colorDistScale + t * colorTimeSpeed + angle * colorAngleScale) % PALETTE.length + PALETTE.length) % PALETTE.length,
      );
      const color = PALETTE[colorIdx];

      if (ch === " ") {
        if (lastColor !== -1) {
          line += "\x1b[0m";
          lastColor = -1;
        }
        line += " ";
      } else {
        if (color !== lastColor) {
          line += `\x1b[38;5;${color}m`;
          lastColor = color;
        }
        line += ch;
      }
    }
    if (lastColor !== -1) {
      line += "\x1b[0m";
      lastColor = -1;
    }
    lines.push(line);
  }

  lines.push(`\x1b[K ${SPIN[s.frame % SPIN.length]} ${s.message}`);
  process.stdout.write(`\x1b[H${lines.join("\n")}`);
}

// ── Public API ───────────────────────────────────────────────────────────

const config: AnimationConfig<State> = { init, step, render, intervalMs: 60, reserveRows: 2 };

export function createKaleidoscopeSpinner(initialMessage: string): Spinner | null {
  return createAnimationSpinner(config, initialMessage);
}
