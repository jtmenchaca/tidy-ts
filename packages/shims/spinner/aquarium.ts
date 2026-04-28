/**
 * ASCII aquarium animation for the terminal.
 *
 * Renders fish swimming back and forth with rising bubbles across the full
 * terminal window. Displayed during long-running CLI operations to keep
 * things entertaining.
 */

import process from "node:process";
import type { Spinner } from "./spinner.ts";
import { fadeIn, fadeOut } from "./transition.ts";

// ── Sprites ─────────────────────────────────────────────────────────────────

interface Fish {
  row: number;
  col: number;
  speed: number;
  sprite: number;
}

const FISH_RIGHT = ["><>", "><))'>", "}><((('>"];
const FISH_LEFT = ["<><", "<'((<>", "<')))><{"];

interface Bubble {
  row: number;
  col: number;
  ticksPerRise: number;
  tick: number;
  char: string;
}

const BUBBLE_CHARS = [".", "o", "O"];

interface Seaweed {
  col: number;
  height: number;
}

const SEAWEED_FRAMES = [
  ["(", ")", "("],
  [")", "(", ")"],
];

// ── State ───────────────────────────────────────────────────────────────────

interface State {
  fish: Fish[];
  bubbles: Bubble[];
  seaweed: Seaweed[];
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
  const rows = Math.max(termRows - 4, 8);

  const fishCount = Math.max(4, Math.min(Math.floor(rows * 0.5), 12));
  const fish: Fish[] = [];
  for (let i = 0; i < fishCount; i++) {
    const right = Math.random() > 0.5;
    const sprite = Math.floor(Math.random() * FISH_RIGHT.length);
    const w = FISH_RIGHT[sprite].length;
    fish.push({
      row: 1 + Math.floor(Math.random() * (rows - 3)),
      col: right ? -w + Math.floor(Math.random() * cols) : Math.floor(Math.random() * cols),
      speed: (0.4 + Math.random() * 0.8) * (right ? 1 : -1),
      sprite,
    });
  }

  const seaweed: Seaweed[] = [];
  for (let i = 0; i < Math.max(5, Math.floor(cols / 6)); i++) {
    seaweed.push({
      col: Math.floor(Math.random() * (cols - 2)) + 1,
      height: 1 + Math.floor(Math.random() * 3),
    });
  }

  return {
    fish,
    bubbles: [],
    seaweed,
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

  for (const f of s.fish) {
    f.col += f.speed;
    const w = (f.speed > 0 ? FISH_RIGHT : FISH_LEFT)[f.sprite].length;

    if (f.speed > 0 && f.col > s.cols + 2) {
      f.col = -w;
      f.row = 1 + Math.floor(Math.random() * (s.rows - 3));
      f.sprite = Math.floor(Math.random() * FISH_RIGHT.length);
    } else if (f.speed < 0 && f.col < -w - 2) {
      f.col = s.cols;
      f.row = 1 + Math.floor(Math.random() * (s.rows - 3));
      f.sprite = Math.floor(Math.random() * FISH_RIGHT.length);
    }

    if (Math.random() < 0.03) {
      const mc = Math.round(f.col + (f.speed > 0 ? w : -1));
      if (mc >= 1 && mc < s.cols - 1) {
        s.bubbles.push({
          row: f.row - 1,
          col: mc,
          ticksPerRise: 2 + Math.floor(Math.random() * 3),
          tick: 0,
          char: BUBBLE_CHARS[Math.floor(Math.random() * BUBBLE_CHARS.length)],
        });
      }
    }
  }

  for (const b of s.bubbles) {
    b.tick++;
    if (b.tick >= b.ticksPerRise) {
      b.tick = 0;
      b.row--;
      if (Math.random() < 0.3) {
        b.col += Math.random() > 0.5 ? 1 : -1;
        b.col = Math.max(1, Math.min(b.col, s.cols - 2));
      }
    }
  }
  s.bubbles = s.bubbles.filter((b) => b.row >= 0);
}

// ── Rendering ───────────────────────────────────────────────────────────────

const SPIN = ["\u280B", "\u2819", "\u2839", "\u2838", "\u283C", "\u2834", "\u2826", "\u2827", "\u2807", "\u280F"];

function render(s: State) {
  const { cols, rows } = s;
  const innerW = cols - 2;

  const grid: string[][] = [];
  for (let r = 0; r < rows; r++) {
    grid.push(new Array(innerW).fill(" "));
  }

  // Seabed
  const bottom = rows - 1;
  for (let c = 0; c < innerW; c++) grid[bottom][c] = "~";

  // Seaweed
  const sway = s.frame % 6 < 3 ? 0 : 1;
  for (const sw of s.seaweed) {
    const c = sw.col - 1;
    if (c < 0 || c >= innerW) continue;
    for (let h = 0; h < sw.height; h++) {
      const r = bottom - 1 - h;
      if (r >= 0) grid[r][c] = SEAWEED_FRAMES[sway][h % 3];
    }
  }

  // Fish
  for (const f of s.fish) {
    const right = f.speed > 0;
    const sprite = (right ? FISH_RIGHT : FISH_LEFT)[f.sprite];
    const sc = Math.round(f.col) - 1;
    if (f.row < 0 || f.row >= rows - 1) continue;
    for (let i = 0; i < sprite.length; i++) {
      const c = sc + i;
      if (c >= 0 && c < innerW) grid[f.row][c] = sprite[i];
    }
  }

  // Bubbles
  for (const b of s.bubbles) {
    const c = b.col - 1;
    if (b.row >= 0 && b.row < rows && c >= 0 && c < innerW) {
      grid[b.row][c] = b.char;
    }
  }

  const hBar = "\u2500".repeat(cols - 2);
  const lines: string[] = [`\x1b[36m\u256D${hBar}\u256E\x1b[0m`];
  for (let r = 0; r < rows; r++) {
    lines.push(
      `\x1b[36m\u2502\x1b[0m\x1b[34m${grid[r].join("")}\x1b[0m\x1b[36m\u2502\x1b[0m`,
    );
  }
  lines.push(`\x1b[36m\u2570${hBar}\u256F\x1b[0m`);
  lines.push(`\x1b[K ${SPIN[s.frame % SPIN.length]} ${s.message}`);

  process.stdout.write(`\x1b[H${lines.join("\n")}`);
}

// ── Public API ──────────────────────────────────────────────────────────────

export function createAquariumSpinner(initialMessage: string): Spinner | null {
  const isTTY = process.stdout.isTTY ?? false;
  if (!isTTY) return null;

  const s = init(initialMessage);
  s.originalLog = console.log;

  // Hide cursor, fade in, then start animation
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

  // Buffer console.log calls
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
    s.rows = Math.max((process.stdout.rows || 24) - 4, 8);
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
