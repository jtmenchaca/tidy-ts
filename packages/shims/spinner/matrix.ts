/**
 * Matrix digital rain animation for the terminal.
 *
 * Green characters fall from the top of the screen like the iconic
 * Matrix movie effect, with the status message at the bottom.
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

// Half-width katakana + digits + a few latin chars, like the actual movie
const CHARS = "\uFF66\uFF67\uFF68\uFF69\uFF6A\uFF6B\uFF6C\uFF6D\uFF6E\uFF6F\uFF70\uFF71\uFF72\uFF73\uFF74\uFF75\uFF76\uFF77\uFF78\uFF79\uFF7A\uFF7B\uFF7C\uFF7D\uFF7E\uFF7F\uFF80\uFF81\uFF82\uFF83\uFF84\uFF85\uFF86\uFF87\uFF88\uFF89\uFF8A\uFF8B\uFF8C\uFF8D\uFF8E\uFF8F\uFF90\uFF91\uFF92\uFF93\uFF94\uFF95\uFF96\uFF97\uFF98\uFF99\uFF9A\uFF9B0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZABCDEFGHIJKLMNOPQRSTUVWXYZ";

// Words that occasionally stream down in place of random characters
const WORDS = [
  "TIDY", "DATA", "FRAME", "WASM", "RUST", "DENO", "NODE", "ASYNC",
  "QUERY", "JOIN", "PIVOT", "GROUP", "SORT", "SLICE", "STATS", "MEAN",
  "SUM", "COUNT", "MERGE", "FILTER", "MUTATE", "SELECT", "GRAPH",
  "ARROW", "PARQUET", "CSV", "JSON", "COLUMN", "ROWS", "INDEX",
  "NULL", "TYPE", "BOOL", "INT", "FLOAT", "STRING", "DATE", "ENUM",
  "HELLO", "WORLD", "FISH", "NYAN", "CAT", "MATRIX", "NEO", "RABBIT",
  "SPOON", "RED", "BLUE", "PILL", "WAKE", "UP", "FOLLOW",
];

interface Drop {
  col: number;
  row: number;
  speed: number;
  length: number;
  chars: string[];
  /** Indices in chars[] that belong to a word and shouldn't be flickered. */
  locked: Set<number>;
}

interface State extends BaseState {
  drops: Drop[];
}

function randChar(): string {
  return CHARS[Math.floor(Math.random() * CHARS.length)];
}

function createDrop(cols: number, rows: number, startAtTop: boolean): Drop {
  const length = 4 + Math.floor(Math.random() * (rows * 0.6));
  const chars: string[] = [];
  for (let i = 0; i < length; i++) chars.push(randChar());

  // ~15% chance to embed a word in the drop
  const locked = new Set<number>();
  if (Math.random() < 0.15 && length >= 6) {
    const word = WORDS[Math.floor(Math.random() * WORDS.length)];
    if (word.length <= length - 2) {
      const start = 1 + Math.floor(Math.random() * (length - word.length - 1));
      for (let i = 0; i < word.length; i++) {
        chars[start + i] = word[i];
        locked.add(start + i);
      }
    }
  }

  return {
    col: Math.floor(Math.random() * cols),
    row: startAtTop ? -length : -Math.floor(Math.random() * rows),
    speed: 0.2 + Math.random() * 1.0,
    length,
    chars,
    locked,
  };
}

function init(msg: string): State {
  const base = createBaseState(msg, 2);
  const { cols, rows } = base;

  const dropCount = Math.max(12, Math.floor(cols / 2));
  const drops: Drop[] = [];
  for (let i = 0; i < dropCount; i++) {
    drops.push(createDrop(cols, rows, false));
  }

  return { ...base, drops };
}

// ── Simulation ──────────────────────────────────────────────────────────────

function step(s: State) {
  s.frame++;

  for (let i = 0; i < s.drops.length; i++) {
    const d = s.drops[i];
    d.row += d.speed;

    // Mutate a random character occasionally for the "flicker" effect (skip word chars)
    if (Math.random() < 0.1) {
      const idx = Math.floor(Math.random() * d.chars.length);
      if (!d.locked.has(idx)) {
        d.chars[idx] = randChar();
      }
    }

    // Respawn if the whole trail is off-screen
    if (d.row - d.length > s.rows) {
      s.drops[i] = createDrop(s.cols, s.rows, true);
    }
  }
}

// ── Rendering ───────────────────────────────────────────────────────────────

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

const config: AnimationConfig<State> = { init, step, render, intervalMs: 80, reserveRows: 2 };

export function createMatrixSpinner(initialMessage: string): Spinner | null {
  return createAnimationSpinner(config, initialMessage);
}
