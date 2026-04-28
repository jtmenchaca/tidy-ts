/**
 * Minimal CLI spinner for long-running operations.
 * Uses \r to overwrite the current line. Falls back gracefully if not a TTY.
 */

const FRAMES = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];

export interface Spinner {
  /** Update the spinner message */
  update(message: string): void;
  /** Log a line without clobbering the spinner */
  log(message: string): void;
  /** Stop and print a final message (with newline) */
  stop(message: string): void;
}

export function createSpinner(initialMessage: string): Spinner {
  const isTTY = Deno.stdout.isTerminal();
  let frame = 0;
  let message = initialMessage;
  let stopped = false;

  const encoder = new TextEncoder();

  function write(text: string) {
    Deno.stdout.writeSync(encoder.encode(text));
  }

  /** Clear the current spinner line so a log can print cleanly */
  function clearLine() {
    if (isTTY) write("\r\x1b[K");
  }

  const interval = isTTY
    ? setInterval(() => {
        if (stopped) return;
        write(`\r${FRAMES[frame % FRAMES.length]} ${message}`);
        frame++;
      }, 80)
    : null;

  /** Redraw the spinner immediately */
  function redraw() {
    if (isTTY && !stopped) {
      write(`\r${FRAMES[frame % FRAMES.length]} ${message}`);
    }
  }

  // Intercept console.log while spinner is active so batch logs don't interleave
  const originalLog = console.log;
  console.log = (...args: unknown[]) => {
    if (stopped) {
      originalLog(...args);
      return;
    }
    clearLine();
    originalLog(...args);
    redraw();
  };

  // Print initial message for non-TTY
  if (!isTTY) {
    originalLog(`  ${initialMessage}`);
  }

  return {
    update(msg: string) {
      message = msg;
      if (!isTTY) {
        originalLog(`  ${msg}`);
      }
    },
    log(msg: string) {
      clearLine();
      originalLog(msg);
      redraw();
    },
    stop(msg: string) {
      stopped = true;
      if (interval) clearInterval(interval);
      // Restore console.log
      console.log = originalLog;
      if (isTTY) {
        write(`\r\x1b[K${msg}\n`);
      } else {
        originalLog(msg);
      }
    },
  };
}

/**
 * Run an async function with a spinner. Automatically stops on completion or error.
 */
export async function withSpinner<T>(
  message: string,
  fn: (spinner: Spinner) => Promise<T>,
): Promise<T> {
  const spinner = createSpinner(message);
  try {
    const result = await fn(spinner);
    return result;
  } catch (err) {
    spinner.stop(`✗ ${message} — failed`);
    throw err;
  }
}
