/**
 * Matrix digital rain animation for the terminal.
 *
 * Green characters fall from the top of the screen like the iconic
 * Matrix movie effect, with the status message at the bottom.
 */

import process from "node:process";
import type { Spinner } from "./spinner.ts";
import { fadeIn, fadeOut } from "./transition.ts";

// Half-width katakana + digits + a few latin chars, like the actual movie
const CHARS = "\uFF66\uFF67\uFF68\uFF69\uFF6A\uFF6B\uFF6C\uFF6D\uFF6E\uFF6F\uFF70\uFF71\uFF72\uFF73\uFF74\uFF75\uFF76\uFF77\uFF78\uFF79\uFF7A\uFF7B\uFF7C\uFF7D\uFF7E\uFF7F\uFF80\uFF81\uFF82\uFF83\uFF84\uFF85\uFF86\uFF87\uFF88\uFF89\uFF8A\uFF8B\uFF8C\uFF8D\uFF8E\uFF8F\uFF90\uFF91\uFF92\uFF93\uFF94\uFF95\uFF96\uFF97\uFF98\uFF99\uFF9A\uFF9B0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZABCDEFGHIJKLMNOPQRSTUVWXYZ";

interface Drop {
  col: number;
  row: number;
  speed: number;
  length: number;
  chars: string[];
}

interface State {
  drops: Drop[];
  frame: number;
  cols: number;
  rows: number;
  message: string;
  stopped: boolean;
  interval: ReturnType<typeof setInterval> | null;
  originalLog: typeof console.log;
  logBuffer: string[];
}

function randChar(): string {
  return CHARS[Math.floor(Math.random() * CHARS.length)];
}

function createDrop(cols: number, rows: number, startAtTop: boolean): Drop {
  const length = 4 + Math.floor(Math.random() * (rows * 0.6));
  const chars: string[] = [];
  for (let i = 0; i < length; i++) chars.push(randChar());
  return {
    col: Math.floor(Math.random() * cols),
    row: startAtTop ? -length : -Math.floor(Math.random() * rows),
    speed: 0.2 + Math.random() * 1.0,
    length,
    chars,
  };
}

function init(msg: string): State {
  const cols = process.stdout.columns || 80;
  const termRows = process.stdout.rows || 24;
  const rows = termRows - 2;

  const dropCount = Math.max(12, Math.floor(cols / 2));
  const drops: Drop[] = [];
  for (let i = 0; i < dropCount; i++) {
    drops.push(createDrop(cols, rows, false));
  }

  return {
    drops,
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

  for (let i = 0; i < s.drops.length; i++) {
    const d = s.drops[i];
    d.row += d.speed;

    // Mutate a random character occasionally for the "flicker" effect
    if (Math.random() < 0.1) {
      const idx = Math.floor(Math.random() * d.chars.length);
      d.chars[idx] = randChar();
    }

    // Respawn if the whole trail is off-screen
    if (d.row - d.length > s.rows) {
      s.drops[i] = createDrop(s.cols, s.rows, true);
    }
  }
}

// ── Rendering ───────────────────────────────────────────────────────────────

const SPIN = ["\u280B", "\u2819", "\u2839", "\u2838", "\u283C", "\u2834", "\u2826", "\u2827", "\u2807", "\u280F"];

function render(s: State) {
  const { cols, rows } = s;

  // Build a grid of {char, brightness} — brightness 0=empty, 1=dim, 2=normal, 3=bright(head)
  const grid: { ch: string; bright: number }[][] = [];
  for (let r = 0; r < rows; r++) {
    const row: { ch: string; bright: number }[] = [];
    for (let c = 0; c < cols; c++) {
      row.push({ ch: " ", bright: 0 });
    }
    grid.push(row);
  }

  for (const d of s.drops) {
    const headRow = Math.floor(d.row);
    for (let i = 0; i < d.length; i++) {
      const r = headRow - i;
      if (r < 0 || r >= rows || d.col < 0 || d.col >= cols) continue;

      const distFromHead = i;
      let bright: number;
      if (distFromHead === 0) bright = 3; // head: bright white-green
      else if (distFromHead < d.length * 0.3) bright = 2; // near head: bright green
      else bright = 1; // tail: dim green

      // Only overwrite if this drop is brighter (front drops win)
      if (bright > grid[r][d.col].bright) {
        grid[r][d.col] = { ch: d.chars[i], bright };
      }
    }
  }

  // Render to string
  let out = "\x1b[H";
  for (let r = 0; r < rows; r++) {
    let line = "";
    let lastBright = -1;
    for (let c = 0; c < cols; c++) {
      const cell = grid[r][c];
      if (cell.bright !== lastBright) {
        switch (cell.bright) {
          case 0:
            line += "\x1b[0m";
            break;
          case 1:
            line += "\x1b[38;5;22m"; // dark green (tail)
            break;
          case 2:
            line += "\x1b[38;5;34m"; // medium green
            break;
          case 3:
            line += "\x1b[1;92m"; // bright/bold green (head glow)
            break;
        }
        lastBright = cell.bright;
      }
      line += cell.ch;
    }
    line += "\x1b[0m";
    out += line + "\n";
  }

  // Status line
  out += `\x1b[K ${SPIN[s.frame % SPIN.length]} ${s.message}`;
  process.stdout.write(out);
}

// ── Public API ──────────────────────────────────────────────────────────────

export function createMatrixSpinner(initialMessage: string): Spinner | null {
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
    }, 80);
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
