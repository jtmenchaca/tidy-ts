/**
 * Nyan cat animation for the terminal.
 *
 * A pop-tart cat flies across the screen trailing a rainbow, with
 * twinkling stars in the background.
 */

import process from "node:process";
import type { Spinner } from "./spinner.ts";
import { fadeIn, fadeOut } from "./transition.ts";

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

interface State {
  catCol: number;
  catRow: number;
  bobOffset: number;
  stars: Star[];
  frame: number;
  cols: number;
  rows: number;
  message: string;
  stopped: boolean;
  interval: ReturnType<typeof setInterval> | null;
  originalLog: typeof console.log;
  logBuffer: string[];
}

function init(msg: string): State {
  const cols = process.stdout.columns || 80;
  const termRows = process.stdout.rows || 24;
  const rows = termRows - 2;

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

  return {
    catCol: -CAT_WIDTH,
    catRow,
    bobOffset: 0,
    stars,
    frame: 0,
    cols,
    rows,
    message: msg,
    stopped: false,
    interval: null,
    originalLog: console.log,
    logBuffer: [],
  };
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

const SPIN = ["\u280B", "\u2819", "\u2839", "\u2838", "\u283C", "\u2834", "\u2826", "\u2827", "\u2807", "\u280F"];

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
  // Each column gets a vertical offset based on a sine wave that's
  // phase-shifted by distance from the cat — near the cat it matches
  // the bob, further left it lags behind creating an undulation.
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
        // Rainbow block — determine which stripe color based on this column's wave offset
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

export function createNyanSpinner(initialMessage: string): Spinner | null {
  const isTTY = process.stdout.isTTY ?? false;
  if (!isTTY) return null;

  const s = init(initialMessage);
  s.originalLog = console.log;

  process.stdout.write("\x1b[?25l");
  const cols = process.stdout.columns || 80;
  const termRows = process.stdout.rows || 24;

  fadeIn(cols, termRows).then(() => {
    if (s.stopped) return;
    s.interval = setInterval(() => {
      if (s.stopped) return;
      step(s);
      render(s);
    }, 100);
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
    s.cols = process.stdout.columns || 80;
    s.rows = (process.stdout.rows || 24) - 2;
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
