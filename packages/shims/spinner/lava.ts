/**
 * Lava lamp animation for the terminal.
 *
 * Blobby shapes rise and fall, wobbling side-to-side and shifting
 * between warm colors. Hypnotic and completely unnecessary.
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

// ── Blob shapes (radii for a simple circle-ish stamp) ────────────────────

/** Each blob is stamped as concentric rings of characters. */
const BLOB_CHARS = ["\u2588", "\u2593", "\u2592", "\u2591"]; // ████ ▓▓▓ ▒▒ ░
const COLORS = [
  "\x1b[31m", // red
  "\x1b[33m", // yellow
  "\x1b[38;5;208m", // orange (256-color)
  "\x1b[35m", // magenta
];

// ── State ────────────────────────────────────────────────────────────────

interface Blob {
  x: number;
  y: number;
  vy: number;
  radius: number;
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

  const count = Math.max(4, Math.min(Math.floor((cols * rows) / 200), 10));
  const blobs: Blob[] = [];
  for (let i = 0; i < count; i++) {
    blobs.push({
      x: 2 + Math.random() * (cols - 4),
      y: 2 + Math.random() * (rows - 4),
      vy: (Math.random() > 0.5 ? 1 : -1) * (0.15 + Math.random() * 0.25),
      radius: 1.5 + Math.random() * 2,
      wobblePhase: Math.random() * Math.PI * 2,
      wobbleAmp: 0.3 + Math.random() * 0.8,
      color: Math.floor(Math.random() * COLORS.length),
    });
  }

  return { ...base, blobs };
}

// ── Simulation ───────────────────────────────────────────────────────────

function step(s: State) {
  s.frame++;

  for (const b of s.blobs) {
    // Vertical drift
    b.y += b.vy;

    // Bounce off top/bottom
    if (b.y < b.radius + 1) {
      b.y = b.radius + 1;
      b.vy = Math.abs(b.vy);
      // Shift color on bounce
      b.color = (b.color + 1) % COLORS.length;
    } else if (b.y > s.rows - b.radius - 2) {
      b.y = s.rows - b.radius - 2;
      b.vy = -Math.abs(b.vy);
      b.color = (b.color + 1) % COLORS.length;
    }

    // Horizontal wobble
    b.wobblePhase += 0.08;
    b.x += Math.sin(b.wobblePhase) * b.wobbleAmp;

    // Clamp horizontal
    b.x = Math.max(b.radius + 1, Math.min(b.x, s.cols - b.radius - 2));

    // Subtle radius pulsing
    b.radius += Math.sin(s.frame * 0.05 + b.wobblePhase) * 0.02;
    b.radius = Math.max(1.2, Math.min(b.radius, 3.5));
  }
}

// ── Rendering ────────────────────────────────────────────────────────────

function render(s: State) {
  const { cols, rows } = s;

  // Grid stores [char, colorIndex] — -1 means no blob
  const grid: [string, number][][] = [];
  for (let r = 0; r < rows; r++) {
    const row: [string, number][] = [];
    for (let c = 0; c < cols; c++) {
      row.push([" ", -1]);
    }
    grid.push(row);
  }

  // Stamp each blob onto the grid
  for (const b of s.blobs) {
    const maxR = Math.ceil(b.radius) + 1;
    for (let dy = -maxR; dy <= maxR; dy++) {
      for (let dx = -maxR; dx <= maxR; dx++) {
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > b.radius + 0.5) continue;

        const gr = Math.round(b.y + dy);
        const gc = Math.round(b.x + dx);
        if (gr < 0 || gr >= rows || gc < 0 || gc >= cols) continue;

        // Pick character based on distance from center
        const ring = Math.floor((dist / (b.radius + 0.5)) * BLOB_CHARS.length);
        const charIdx = Math.min(ring, BLOB_CHARS.length - 1);

        // Closer to center wins (overwrite only if denser)
        const existing = grid[gr][gc][0];
        const existingIdx = BLOB_CHARS.indexOf(existing);
        if (existingIdx === -1 || charIdx < existingIdx) {
          grid[gr][gc] = [BLOB_CHARS[charIdx], b.color];
        }
      }
    }
  }

  // Build output
  const lines: string[] = [];
  for (let r = 0; r < rows; r++) {
    let line = "";
    let lastColor = -1;
    for (let c = 0; c < cols; c++) {
      const [ch, ci] = grid[r][c];
      if (ci !== lastColor) {
        line += ci >= 0 ? COLORS[ci] : "\x1b[0m";
        lastColor = ci;
      }
      line += ch;
    }
    line += "\x1b[0m";
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
