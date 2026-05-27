import { spawn } from "node:child_process";
import process from "node:process";

const PORT = 9147;
const CDP_PORT = 9223;
const url = `http://localhost:${PORT}/`;

let msgId = 1;
const pending = new Map();
let ws;

function send(method, params = {}) {
  const id = msgId++;
  return new Promise((resolve) => {
    pending.set(id, resolve);
    ws.send(JSON.stringify({ id, method, params }));
  });
}

// Start vite dev server on an uncommon port.
// NOTE: <PKG_NAME> is substituted by the setup-repo skill at scaffold time
// (rules/spa/overview.md Step 4). If you copied this file by hand, replace
// <PKG_NAME> with your SPA package's name, e.g. "@myproject/website".
const vite = spawn(
  "pnpm",
  ["--filter", "<PKG_NAME>", "dev", "--port", String(PORT)],
  { stdio: ["ignore", "pipe", "pipe"] },
);

// Wait for vite to be ready by polling the port
for (let i = 0; i < 30; i++) {
  try {
    await fetch(url);
    break;
  } catch {
    if (i === 29) throw new Error("Vite dev server did not start within 3s");
    await new Promise((r) => setTimeout(r, 100));
  }
}

// macOS path. On Linux, change to "/usr/bin/google-chrome" or similar.
// On Windows, point at chrome.exe under Program Files.
const chrome = spawn(
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  [
    "--headless=new",
    "--disable-gpu",
    "--no-sandbox",
    "--remote-debugging-port=" + CDP_PORT,
    "--user-data-dir=/tmp/chrome-cdp-" + Date.now(),
    url,
  ],
  { stdio: ["ignore", "pipe", "pipe"] },
);

// Wait for CDP to be ready
for (let i = 0; i < 30; i++) {
  try {
    await fetch(`http://127.0.0.1:${CDP_PORT}/json`);
    break;
  } catch {
    if (i === 29) throw new Error("Chrome CDP did not start within 3s");
    await new Promise((r) => setTimeout(r, 100));
  }
}

let exitCode = 0;

try {
  const listRes = await fetch(`http://127.0.0.1:${CDP_PORT}/json`);
  const tabs = await listRes.json();
  const tab = tabs.find((t) => t.url.includes("localhost")) || tabs[0];
  const wsUrl = tab?.webSocketDebuggerUrl;
  if (!wsUrl) throw new Error("No CDP websocket. Tabs: " + JSON.stringify(tabs));

  ws = new WebSocket(wsUrl);
  await new Promise((res, rej) => {
    ws.onopen = res;
    ws.onerror = rej;
  });

  const consoleErrors = [];
  const consoleWarnings = [];
  const exceptions = [];
  let collecting = false;

  ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    if (data.id && pending.has(data.id)) {
      pending.get(data.id)(data);
      pending.delete(data.id);
    }
    if (!collecting) return;
    if (data.method === "Runtime.consoleAPICalled") {
      const args = data.params.args
        .map((a) => a.value ?? a.description ?? String(a.type))
        .join(" ");
      const entry = { type: data.params.type, text: args };
      if (data.params.type === "error") consoleErrors.push(entry);
      else if (data.params.type === "warning") consoleWarnings.push(entry);
    }
    if (data.method === "Runtime.exceptionThrown") {
      const ex = data.params.exceptionDetails;
      exceptions.push(ex.exception?.description ?? ex.text);
    }
    if (data.method === "Log.entryAdded") {
      const e = data.params.entry;
      const entry = {
        type: e.level,
        text: e.text + (e.url ? " (" + e.url + ")" : ""),
      };
      if (e.level === "error") consoleErrors.push(entry);
      else if (e.level === "warning") consoleWarnings.push(entry);
    }
  };

  await send("Runtime.enable");
  await send("Log.enable");
  await send("Network.enable");

  // Reload the page and wait for load event
  const loadFired = new Promise((resolve) => {
    const orig = ws.onmessage;
    ws.onmessage = (event) => {
      orig(event);
      const data = JSON.parse(event.data);
      if (data.method === "Page.loadEventFired") resolve();
    };
  });
  await send("Page.enable");
  collecting = true;
  await send("Page.reload");
  await loadFired;

  // Give the page 2s to load and settle
  await new Promise((r) => setTimeout(r, 2000));

  const evalResult = await send("Runtime.evaluate", {
    expression: `JSON.stringify({
      url: location.href,
      title: document.title,
      rootChildren: document.getElementById('root')?.childElementCount ?? 0,
      rootText: document.getElementById('root')?.innerText?.substring(0, 1000) ?? 'NO_ROOT',
      viteOverlay: !!document.querySelector('vite-error-overlay'),
      hasErrorText: !!(document.getElementById('root')?.innerText || '').match(/error|something went wrong/i),
    })`,
    returnByValue: true,
  });
  const pageState = JSON.parse(evalResult.result?.result?.value ?? "{}");

  const hasErrors =
    exceptions.length > 0 ||
    consoleErrors.length > 0 ||
    pageState.viteOverlay ||
    pageState.hasErrorText ||
    pageState.rootChildren === 0;

  if (hasErrors) {
    exitCode = 1;
    console.log("FAIL - Browser errors detected\n");
  } else {
    console.log("PASS - No browser errors\n");
  }

  console.log("=== PAGE STATE ===");
  console.log(JSON.stringify(pageState, null, 2));

  if (exceptions.length > 0) {
    console.log("\n=== UNCAUGHT EXCEPTIONS ===");
    for (const ex of exceptions) console.log("  " + ex);
  }

  if (consoleErrors.length > 0) {
    console.log("\n=== CONSOLE ERRORS ===");
    for (const msg of consoleErrors) console.log("  " + msg.text);
  }

  if (consoleWarnings.length > 0) {
    console.log("\n=== CONSOLE WARNINGS ===");
    for (const msg of consoleWarnings) console.log("  " + msg.text);
  }

  ws.close();
} catch (e) {
  console.log("FAIL - Script error:", e.message);
  exitCode = 1;
}

chrome.kill();
vite.kill();
process.exit(exitCode);
