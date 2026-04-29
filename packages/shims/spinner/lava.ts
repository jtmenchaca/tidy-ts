/**
 * Lava lamp animation for the terminal.
 *
 * Uses a metaball density field so blobs merge and split organically
 * as they drift up and down. Warm colors on a dark background.
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

// Density thresholds → characters (high density = solid, low = wispy edge)
const BANDS: [number, string][] = [
  [1.6, "\u2588"], // ████  core
  [0.9, "\u2593"], // ▓▓▓▓  inner
  [0.5, "\u2592"], // ▒▒▒▒  mid
  [0.3, "\u2591"], // ░░░░  edge
];

const COLORS = [
  "\x1b[91m",        // bright red
  "\x1b[33m",        // yellow
  "\x1b[38;5;208m",  // orange
  "\x1b[38;5;196m",  // deep red
  "\x1b[35m",        // magenta
];

// Dark background fill for the "glass" of the lamp
const BG = "\x1b[38;5;236m\u00B7\x1b[0m";

// ── State ────────────────────────────────────────────────────────────────

interface Blob {
  x: number;
  y: number;
  vy: number;
  /** Metaball radius — controls field strength falloff */
  r: number;
  wobblePhase: number;
  wobbleAmp: number;
  color: number;
}

interface State extends BaseState {
  blobs: Blob[];
}

function init(msg: string): State {
  const base = createBaseState(msg, 3);
  const { cols, rows } = base;

  // Enough blobs to get merging, but not so many that they fill everything
  const count = Math.max(4, Math.min(Math.floor((cols * rows) / 300), 8));
  const blobs: Blob[] = [];
  for (let i = 0; i < count; i++) {
    blobs.push({
      x: cols * 0.15 + Math.random() * cols * 0.7,
      y: Math.random() * rows,
      vy: (Math.random() > 0.5 ? 1 : -1) * (0.06 + Math.random() * 0.1),
      r: 6 + Math.random() * 5,
      wobblePhase: Math.random() * Math.PI * 2,
      wobbleAmp: 0.2 + Math.random() * 0.4,
      color: Math.floor(Math.random() * COLORS.length),
    });
  }

  return { ...base, blobs };
}

// ── Simulation ───────────────────────────────────────────────────────────

function step(s: State) {
  s.frame++;

  for (const b of s.blobs) {
    b.y += b.vy;

    // Bounce off top/bottom — shift color
    if (b.y < -2) {
      b.vy = Math.abs(b.vy);
      b.color = (b.color + 1) % COLORS.length;
    } else if (b.y > s.rows + 2) {
      b.vy = -Math.abs(b.vy);
      b.color = (b.color + 1) % COLORS.length;
    }

    // Slow horizontal wobble
    b.wobblePhase += 0.02;
    b.x += Math.sin(b.wobblePhase) * b.wobbleAmp;
    b.x = Math.max(-4, Math.min(b.x, s.cols + 4));

    // Gentle radius breathing
    b.r += Math.sin(s.frame * 0.02 + b.wobblePhase) * 0.05;
    b.r = Math.max(6, Math.min(b.r, 16));
  }
}

// ── Rendering ────────────────────────────────────────────────────────────

function render(s: State) {
  const { cols, rows, blobs } = s;

  const lines: string[] = [];

  for (let r = 0; r < rows; r++) {
    let line = "";
    let lastColorCode = "";

    for (let c = 0; c < cols; c++) {
      // Sum metaball field: each blob contributes r² / (dx² + dy²)
      let density = 0;
      let dominantColor = 0;
      let bestContrib = 0;

      for (const b of blobs) {
        const dx = c - b.x;
        // Terminal chars are ~2x tall as wide, so compress y
        const dy = (r - b.y) * 2;
        const distSq = dx * dx + dy * dy;
        const contrib = (b.r * b.r) / (distSq + 1);
        density += contrib;
        if (contrib > bestContrib) {
          bestContrib = contrib;
          dominantColor = b.color;
        }
      }

      // Pick character based on density
      let ch: string | null = null;
      for (const [threshold, char] of BANDS) {
        if (density >= threshold) {
          ch = char;
          break;
        }
      }

      if (ch) {
        const colorCode = COLORS[dominantColor];
        if (colorCode !== lastColorCode) {
          line += colorCode;
          lastColorCode = colorCode;
        }
        line += ch;
      } else {
        if (lastColorCode !== "") {
          line += "\x1b[0m";
          lastColorCode = "";
        }
        line += BG;
      }
    }
    if (lastColorCode !== "") line += "\x1b[0m";
    lines.push(line);
  }

  lines.push(`\x1b[K ${SPIN[s.frame % SPIN.length]} ${s.message}`);
  process.stdout.write(`\x1b[H${lines.join("\n")}`);
}

// ── Public API ───────────────────────────────────────────────────────────

const config: AnimationConfig<State> = { init, step, render, intervalMs: 80, reserveRows: 3 };

export function createLavaSpinner(initialMessage: string): Spinner | null {
  return createAnimationSpinner(config, initialMessage);
}
