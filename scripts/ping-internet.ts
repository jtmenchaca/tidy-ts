/**
 * Pings a safe endpoint on an interval and reports connection status
 * via the @tidy-ts/shims spinner.
 *
 * Usage: deno run -A scripts/ping-internet.ts
 *
 * The spinner line shows the latest probe (latency + state). State changes
 * (online <-> offline) are emitted as persistent log lines above the spinner.
 * Ctrl+C to stop.
 */

import { createSpinner } from "@tidy-ts/shims/spinner";

const ENDPOINT = "https://www.cloudflare.com/cdn-cgi/trace";
const INTERVAL_MS = 3000;
const TIMEOUT_MS = 2500;

function ts(): string {
  return new Date().toISOString().slice(11, 19);
}

async function check(): Promise<{ ok: boolean; ms: number; detail: string }> {
  const start = performance.now();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(ENDPOINT, {
      signal: controller.signal,
      cache: "no-store",
    });
    const ms = Math.round(performance.now() - start);
    await res.body?.cancel();
    if (!res.ok) return { ok: false, ms, detail: `HTTP ${res.status}` };
    return { ok: true, ms, detail: "OK" };
  } catch (err) {
    const ms = Math.round(performance.now() - start);
    const msg = err instanceof Error ? err.message : String(err);
    return { ok: false, ms, detail: msg };
  } finally {
    clearTimeout(timer);
  }
}

const spinner = createSpinner(`ping ${ENDPOINT}`, "simple");
let lastOk: boolean | null = null;

async function tick() {
  const { ok, ms, detail } = await check();
  const marker = ok ? "online " : "offline";
  spinner.update(`${marker}  ${ms.toString().padStart(4)}ms  ${detail}`);
  if (lastOk !== null && lastOk !== ok) {
    spinner.log(`[${ts()}] state change: ${lastOk ? "online" : "offline"} -> ${ok ? "online" : "offline"} (${detail})`);
  }
  lastOk = ok;
}

await tick();
const interval = setInterval(tick, INTERVAL_MS);

const stop = async () => {
  clearInterval(interval);
  await spinner.stop(`stopped — last status: ${lastOk ? "online" : "offline"}`);
  Deno.exit(0);
};

Deno.addSignalListener("SIGINT", stop);
