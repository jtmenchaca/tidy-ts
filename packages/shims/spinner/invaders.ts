/**
 * Space invaders animation for the terminal.
 *
 * YOU control the cannon! Arrow keys (or h/l) to move, space to fire.
 * A fleet of aliens marches side-to-side and descends. They respawn
 * endlessly because the build isn't done yet.
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
const CANNON_W = CANNON.length;
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
  alienDir: number;
  alienSpeed: number;
  moveCounter: number;
  score: number;
  wave: number;
  moveLeft: boolean;
  moveRight: boolean;
  firePressed: boolean;
  fireCooldown: number;
  stdinListener: ((data: Uint8Array) => void) | null;
}

function spawnAliens(cols: number, wave: number): Alien[] {
  const aliens: Alien[] = [];
  const spacing = 5;
  const aliensPerRow = Math.max(3, Math.floor((cols - 4) / spacing));
  const startCol = Math.floor((cols - aliensPerRow * spacing) / 2) + 1;
  const rowCount = Math.min(3 + Math.floor(wave / 3), 5);

  for (let row = 0; row < rowCount; row++) {
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

  return {
    ...base,
    aliens: spawnAliens(base.cols, 0),
    bullets: [],
    explosions: [],
    cannonCol: Math.floor(base.cols / 2) - Math.floor(CANNON_W / 2),
    alienDir: 1,
    alienSpeed: 6,
    moveCounter: 0,
    score: 0,
    wave: 0,
    moveLeft: false,
    moveRight: false,
    firePressed: false,
    fireCooldown: 0,
    stdinListener: null,
  };
}

// ── Input ────────────────────────────────────────────────────────────────

function setup(s: State) {
  if (!process.stdin.isTTY) return;

  process.stdin.setRawMode(true);
  process.stdin.resume();

  const listener = (data: Uint8Array) => {
    if (s.stopped) return;
    const key = data.toString();

    // Arrow keys come as escape sequences
    if (key === "\x1b[D" || key === "h" || key === "a") {
      s.moveLeft = true;
    } else if (key === "\x1b[C" || key === "l" || key === "d") {
      s.moveRight = true;
    } else if (key === " " || key === "\x1b[A" || key === "w" || key === "k") {
      s.firePressed = true;
    }
  };

  s.stdinListener = listener;
  process.stdin.on("data", listener);
}

function teardown(s: State) {
  if (s.stdinListener) {
    process.stdin.removeListener("data", s.stdinListener);
    s.stdinListener = null;
  }
  if (process.stdin.isTTY) {
    process.stdin.setRawMode(false);
    process.stdin.pause();
  }
}

// ── Simulation ───────────────────────────────────────────────────────────

function step(s: State) {
  s.frame++;

  // Player movement (4 cells per tick for snappy response)
  if (s.moveLeft) {
    s.cannonCol = Math.max(0, s.cannonCol - 4);
    s.moveLeft = false;
  }
  if (s.moveRight) {
    s.cannonCol = Math.min(s.cols - CANNON_W, s.cannonCol + 4);
    s.moveRight = false;
  }

  // Player fire
  if (s.fireCooldown > 0) s.fireCooldown--;
  if (s.firePressed && s.fireCooldown === 0) {
    s.bullets.push({ row: s.rows - 3, col: s.cannonCol + 2 });
    s.fireCooldown = 4;
  }
  s.firePressed = false;

  // Move bullets up
  for (const b of s.bullets) {
    b.row--;
  }
  s.bullets = s.bullets.filter((b) => b.row >= 0);

  // Move aliens
  s.moveCounter++;
  const speed = Math.max(1, s.alienSpeed - Math.floor(s.wave / 2));
  if (s.moveCounter >= speed) {
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
      if (b.row === a.row && b.col >= a.col && b.col < a.col + 3) {
        a.alive = false;
        s.score++;
        s.explosions.push({ row: a.row, col: a.col + 1, age: 0 });
        b.row = -1;
      }
    }
  }
  s.bullets = s.bullets.filter((b) => b.row >= 0);

  // Age explosions
  for (const e of s.explosions) {
    e.age++;
  }
  s.explosions = s.explosions.filter((e) => e.age < EXPLOSION_FRAMES.length);

  // Respawn if all dead or if aliens reached the cannon
  const allDead = s.aliens.every((a) => !a.alive);
  const pastCannon = s.aliens.some((a) => a.alive && a.row >= s.rows - 3);
  if (allDead || pastCannon) {
    s.wave++;
    s.aliens = spawnAliens(s.cols, s.wave);
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
    for (let i = 0; i < CANNON_W; i++) {
      const c = s.cannonCol + i;
      if (c >= 0 && c < cols) {
        grid[cannonRow][c] = CANNON[i];
      }
    }
  }

  // Build output with colors
  const lines: string[] = [];
  for (let r = 0; r < rows; r++) {
    let line = "";
    for (let c = 0; c < cols; c++) {
      const ch = grid[r][c];
      if (ch === BULLET) {
        line += `\x1b[33m${ch}\x1b[0m`;
      } else if (EXPLOSION_FRAMES.includes(ch)) {
        line += `\x1b[91m${ch}\x1b[0m`;
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
  const waveStr = `WAVE ${s.wave + 1}`;
  const controls = "\u2190\u2192 move  SPACE fire";
  const infoLeft = `\x1b[33m${scoreStr}\x1b[0m  \x1b[36m${waveStr}\x1b[0m`;
  const infoRight = `${SPIN[s.frame % SPIN.length]} ${s.message}`;
  // Rough pad — strip ANSI for length calc
  const plainLeft = `${scoreStr}  ${waveStr}`;
  const plainRight = `x ${s.message}`;
  const gap = Math.max(1, cols - plainLeft.length - plainRight.length - controls.length - 6);
  const gap2 = Math.max(1, Math.floor(gap / 2));
  lines.push(
    `\x1b[K ${infoLeft}${" ".repeat(gap2)}\x1b[2m${controls}\x1b[0m${" ".repeat(gap - gap2)}${infoRight}`,
  );

  process.stdout.write(`\x1b[H${lines.join("\n")}`);
}

// ── Public API ───────────────────────────────────────────────────────────

const config: AnimationConfig<State> = {
  init,
  step,
  render,
  intervalMs: 60,
  reserveRows: 3,
  setup,
  cleanup: teardown,
};

export function createInvadersSpinner(initialMessage: string): Spinner | null {
  return createAnimationSpinner(config, initialMessage);
}
