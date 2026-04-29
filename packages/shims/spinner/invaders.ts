/**
 * Space invaders animation for the terminal.
 *
 * A fleet of aliens marches side-to-side and descends. A cannon at the
 * bottom auto-fires bullets that destroy them. They respawn endlessly
 * because the build isn't done yet.
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

// ── Sprites ──────────────────────────────────────────────────────────────

const ALIEN_FRAMES = [
  ["/o\\", "\\o/"],
  ["={=", "=}="],
  ["<O>", "<o>"],
];

const CANNON = "_/A\\_";
const BULLET = "|";
const EXPLOSION_FRAMES = ["*", "+", "."];

// ── State ────────────────────────────────────────────────────────────────

interface Alien {
  row: number;
  col: number;
  sprite: number;
  alive: boolean;
}

interface Bullet {
  row: number;
  col: number;
}

interface Explosion {
  row: number;
  col: number;
  age: number;
}

interface State extends BaseState {
  aliens: Alien[];
  bullets: Bullet[];
  explosions: Explosion[];
  cannonCol: number;
  cannonDir: number;
  alienDir: number;
  alienSpeed: number;
  moveCounter: number;
  score: number;
}

function spawnAliens(cols: number): Alien[] {
  const aliens: Alien[] = [];
  const spriteWidth = 3;
  const spacing = 5;
  const aliensPerRow = Math.max(3, Math.floor((cols - 4) / spacing));
  const startCol = Math.floor((cols - aliensPerRow * spacing) / 2) + 1;

  for (let row = 0; row < 3; row++) {
    for (let i = 0; i < aliensPerRow; i++) {
      aliens.push({
        row: 1 + row * 2,
        col: startCol + i * spacing,
        sprite: row % ALIEN_FRAMES.length,
        alive: true,
      });
    }
  }
  return aliens;
}

function init(msg: string): State {
  const base = createBaseState(msg, 3);
  const { cols, rows } = base;

  return {
    ...base,
    aliens: spawnAliens(cols),
    bullets: [],
    explosions: [],
    cannonCol: Math.floor(cols / 2),
    cannonDir: 1,
    alienDir: 1,
    alienSpeed: 3,
    moveCounter: 0,
    score: 0,
  };
}

// ── Simulation ───────────────────────────────────────────────────────────

function step(s: State) {
  s.frame++;

  // Move cannon back and forth
  s.cannonCol += s.cannonDir;
  if (s.cannonCol >= s.cols - 4) s.cannonDir = -1;
  if (s.cannonCol <= 1) s.cannonDir = 1;

  // Auto-fire every few frames
  if (s.frame % 6 === 0) {
    s.bullets.push({ row: s.rows - 3, col: s.cannonCol + 2 });
  }

  // Move bullets up
  for (const b of s.bullets) {
    b.row--;
  }
  s.bullets = s.bullets.filter((b) => b.row >= 0);

  // Move aliens
  s.moveCounter++;
  if (s.moveCounter >= s.alienSpeed) {
    s.moveCounter = 0;

    let dropDown = false;
    for (const a of s.aliens) {
      if (!a.alive) continue;
      if (
        (s.alienDir > 0 && a.col + 3 >= s.cols - 1) ||
        (s.alienDir < 0 && a.col <= 1)
      ) {
        dropDown = true;
        break;
      }
    }

    if (dropDown) {
      s.alienDir *= -1;
      for (const a of s.aliens) {
        if (a.alive) a.row++;
      }
    } else {
      for (const a of s.aliens) {
        if (a.alive) a.col += s.alienDir;
      }
    }
  }

  // Collision detection
  for (const b of s.bullets) {
    for (const a of s.aliens) {
      if (!a.alive) continue;
      if (b.row >= a.row && b.row <= a.row && b.col >= a.col && b.col < a.col + 3) {
        a.alive = false;
        s.score++;
        s.explosions.push({ row: a.row, col: a.col + 1, age: 0 });
        b.row = -1; // mark bullet for removal
      }
    }
  }
  s.bullets = s.bullets.filter((b) => b.row >= 0);

  // Age explosions
  for (const e of s.explosions) {
    e.age++;
  }
  s.explosions = s.explosions.filter((e) => e.age < EXPLOSION_FRAMES.length);

  // Respawn if all dead or if aliens went past the cannon
  const allDead = s.aliens.every((a) => !a.alive);
  const pastCannon = s.aliens.some((a) => a.alive && a.row >= s.rows - 3);
  if (allDead || pastCannon) {
    s.aliens = spawnAliens(s.cols);
  }
}

// ── Rendering ────────────────────────────────────────────────────────────

function render(s: State) {
  const { cols, rows } = s;
  const grid: string[][] = [];
  for (let r = 0; r < rows; r++) {
    grid.push(new Array(cols).fill(" "));
  }

  // Draw aliens
  const animFrame = Math.floor(s.frame / 4) % 2;
  for (const a of s.aliens) {
    if (!a.alive) continue;
    const sprite = ALIEN_FRAMES[a.sprite][animFrame];
    for (let i = 0; i < sprite.length; i++) {
      const c = a.col + i;
      if (a.row >= 0 && a.row < rows && c >= 0 && c < cols) {
        grid[a.row][c] = sprite[i];
      }
    }
  }

  // Draw explosions
  for (const e of s.explosions) {
    if (e.row >= 0 && e.row < rows && e.col >= 0 && e.col < cols) {
      grid[e.row][e.col] = EXPLOSION_FRAMES[e.age];
    }
  }

  // Draw bullets
  for (const b of s.bullets) {
    if (b.row >= 0 && b.row < rows && b.col >= 0 && b.col < cols) {
      grid[b.row][b.col] = BULLET;
    }
  }

  // Draw cannon
  const cannonRow = rows - 2;
  if (cannonRow >= 0) {
    for (let i = 0; i < CANNON.length; i++) {
      const c = s.cannonCol + i;
      if (c >= 0 && c < cols) {
        grid[cannonRow][c] = CANNON[i];
      }
    }
  }

  // Build output
  const lines: string[] = [];
  for (let r = 0; r < rows; r++) {
    let line = "";
    for (let c = 0; c < cols; c++) {
      const ch = grid[r][c];
      if (ch === BULLET) {
        line += `\x1b[33m${ch}\x1b[0m`;
      } else if (EXPLOSION_FRAMES.includes(ch)) {
        line += `\x1b[31m${ch}\x1b[0m`;
      } else if (ch !== " " && r === cannonRow) {
        line += `\x1b[36m${ch}\x1b[0m`;
      } else if (ch !== " ") {
        line += `\x1b[32m${ch}\x1b[0m`;
      } else {
        line += ch;
      }
    }
    lines.push(line);
  }

  const scoreStr = `SCORE: ${s.score}`;
  const pad = Math.max(0, cols - scoreStr.length - s.message.length - 6);
  lines.push(
    `\x1b[K \x1b[33m${scoreStr}\x1b[0m${" ".repeat(pad)}${SPIN[s.frame % SPIN.length]} ${s.message}`,
  );

  process.stdout.write(`\x1b[H${lines.join("\n")}`);
}

// ── Public API ───────────────────────────────────────────────────────────

const config: AnimationConfig<State> = { init, step, render, intervalMs: 80, reserveRows: 3 };

export function createInvadersSpinner(initialMessage: string): Spinner | null {
  return createAnimationSpinner(config, initialMessage);
}
