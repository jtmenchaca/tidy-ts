/**
 * Nyan cat animation for the terminal.
 *
 * A pop-tart cat flies across the screen trailing a rainbow, with
 * twinkling stars in the background.
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

// ── Cat sprite (two frames for leg animation) ──────────────────────────────

const CAT_FRAME_1 = [
  " ,-----,  ",
  " | /\\_/\\ | ",
  " |( ^ .^)| ",
  " ~(  \"  )~ ",
  "  |     |  ",
  "  (\" \" \") ",
  "  '' '' ''  ",
];

const CAT_FRAME_2 = [
  " ,-----,  ",
  " | /\\_/\\ | ",
  " |( o .o)| ",
  " ~(  \"  )~ ",
  "  |     |  ",
  "  (\" \" \") ",
  " ''  '' '' ",
];

const CAT_FRAMES = [CAT_FRAME_1, CAT_FRAME_2];
const CAT_WIDTH = 12;
const CAT_HEIGHT = CAT_FRAMES[0].length;

// Rainbow colors (ANSI 256-color codes for red, orange, yellow, green, blue, magenta)
const RAINBOW_COLORS = [
  "\x1b[91m", // bright red
  "\x1b[33m", // orange/yellow
  "\x1b[93m", // bright yellow
  "\x1b[92m", // bright green
  "\x1b[94m", // bright blue
  "\x1b[95m", // bright magenta
];

// ── Stars ───────────────────────────────────────────────────────────────────

interface Star {
  row: number;
  col: number;
  phase: number;
}

const STAR_CHARS = ["+", "*", ".", "\u00B7"];

// ── State ───────────────────────────────────────────────────────────────────

interface State extends BaseState {
  catCol: number;
  catRow: number;
  bobOffset: number;
  stars: Star[];
}

function init(msg: string): State {
  const base = createBaseState(msg, 2);
  const { cols, rows } = base;

  // Center cat vertically
  const catRow = Math.floor((rows - CAT_HEIGHT) / 2);

  // Scatter stars
  const starCount = Math.max(15, Math.floor((cols * rows) / 80));
  const stars: Star[] = [];
  for (let i = 0; i < starCount; i++) {
    stars.push({
      row: Math.floor(Math.random() * rows),
      col: Math.floor(Math.random() * cols),
      phase: Math.floor(Math.random() * STAR_CHARS.length),
    });
  }

  return { ...base, catCol: -CAT_WIDTH, catRow, bobOffset: 0, stars };
}

// ── Simulation ──────────────────────────────────────────────────────────────

function step(s: State) {
  s.frame++;

  // Cat moves right, wraps around
  s.catCol += 2;
  if (s.catCol > s.cols + 10) {
    s.catCol = -CAT_WIDTH;
  }

  // Gentle vertical bob
  s.bobOffset = Math.round(Math.sin(s.frame * 0.15) * 1.5);

  // Twinkle stars
  for (const star of s.stars) {
    if (Math.random() < 0.05) {
      star.phase = (star.phase + 1) % STAR_CHARS.length;
    }
  }
}

// ── Rendering ───────────────────────────────────────────────────────────────

function render(s: State) {
  const { cols, rows } = s;
  const catFrame = CAT_FRAMES[s.frame % 2];
  const catRow = s.catRow + s.bobOffset;

  // Build grid
  const grid: string[][] = [];
  for (let r = 0; r < rows; r++) {
    grid.push(new Array(cols).fill(" "));
  }

  // Draw stars (behind everything)
  for (const star of s.stars) {
    if (star.row >= 0 && star.row < rows && star.col >= 0 && star.col < cols) {
      grid[star.row][star.col] = STAR_CHARS[star.phase];
    }
  }

  // Draw rainbow trail behind the cat with a wave effect.
  const rainbowEnd = s.catCol;
  const totalStripes = RAINBOW_COLORS.length;
  const baseRainbowTop = s.catRow + 1;

  for (let c = 0; c < rainbowEnd && c < cols; c++) {
    const distFromCat = s.catCol - c;
    const waveOffset = Math.round(
      Math.sin(s.frame * 0.15 - distFromCat * 0.08) * 1.5,
    );
    for (let stripe = 0; stripe < totalStripes; stripe++) {
      const row = baseRainbowTop + stripe + waveOffset;
      if (row >= 0 && row < rows) {
        grid[row][c] = "\u2588";
      }
    }
  }

  // Draw cat
  for (let r = 0; r < catFrame.length; r++) {
    const gridRow = catRow + r;
    if (gridRow < 0 || gridRow >= rows) continue;
    for (let c = 0; c < catFrame[r].length; c++) {
      const gridCol = s.catCol + c;
      if (gridCol >= 0 && gridCol < cols && catFrame[r][c] !== " ") {
        grid[gridRow][gridCol] = catFrame[r][c];
      }
    }
  }

  // Render with colors
  let out = "\x1b[H";
  for (let r = 0; r < rows; r++) {
    let line = "";

    for (let c = 0; c < cols; c++) {
      const ch = grid[r][c];

      // Is this part of the cat?
      const isCat =
        r >= catRow &&
        r < catRow + CAT_HEIGHT &&
        c >= s.catCol &&
        c < s.catCol + CAT_WIDTH;

      if (isCat && ch !== " ") {
        line += `\x1b[97m${ch}\x1b[0m`; // white cat
      } else if (ch === "\u2588" && c < s.catCol) {
        // Rainbow block
        const distFromCat = s.catCol - c;
        const waveOff = Math.round(
          Math.sin(s.frame * 0.15 - distFromCat * 0.08) * 1.5,
        );
        const stripeIdx = r - (baseRainbowTop + waveOff);
        if (stripeIdx >= 0 && stripeIdx < totalStripes) {
          line += `${RAINBOW_COLORS[stripeIdx]}${ch}\x1b[0m`;
        } else {
          line += " ";
        }
      } else if (ch !== " " && !isCat) {
        // Stars — dim white
        line += `\x1b[2;37m${ch}\x1b[0m`;
      } else {
        line += " ";
      }
    }
    out += line + "\n";
  }

  // Status line
  out += `\x1b[K ${SPIN[s.frame % SPIN.length]} ${s.message}`;
  process.stdout.write(out);
}

// ── Public API ──────────────────────────────────────────────────────────────

const config: AnimationConfig<State> = { init, step, render, intervalMs: 100, reserveRows: 2 };

export function createNyanSpinner(initialMessage: string): Spinner | null {
  return createAnimationSpinner(config, initialMessage);
}
