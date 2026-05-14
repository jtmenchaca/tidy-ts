/**
 * Generates Figure 3: Concrete code example — arithmetic on a mixed-type column.
 * Shows the same error in Tidy-TS, Python/pandas, and R/tidyverse.
 * Run: deno run -A docs/JAMIA/figures/render-figure-3.ts
 */
import { resolve, dirname, fromFileUrl } from "jsr:@std/path";

const DIR = dirname(fromFileUrl(import.meta.url));
const OUT = resolve(DIR, "figure-3-code-example.html");

function esc(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

const tidyTs = {
  label: "Tidy-TS (TypeScript)",
  code: [
    { text: "const labs = createDataFrame([", cls: "" },
    { text: '  { patient_id: "A", result: 5.2 },', cls: "" },
    { text: '  { patient_id: "B", result: "MISSING" },', cls: "" },
    { text: '  { patient_id: "C", result: 7.1 },', cls: "" },
    { text: "]);", cls: "" },
    { text: "", cls: "" },
    { text: "const analyzed = labs", cls: "" },
    { text: "  .mutate({", cls: "error-line" },
    { text: '    doubled: (r) => r.<span class="squiggle">result</span> * 2', cls: "error-line", raw: true },
    { text: "  });", cls: "error-line" },
    { text: "// Error: Operator '*' cannot be applied", cls: "error-msg" },
    { text: "// to types 'string | number' and 'number'.", cls: "error-msg" },
  ],
  outcome: "Compile-time error",
  outcomeClass: "outcome-compile",
  detail: "Editor highlights the error before code runs",
};

const pandas = {
  label: "Pandas (Python)",
  code: [
    { text: "labs = pd.DataFrame({", cls: "" },
    { text: '  "patient_id": ["A", "B", "C"],', cls: "" },
    { text: '  "result": [5.2, "MISSING", 7.1],', cls: "" },
    { text: "})", cls: "" },
    { text: "", cls: "" },
    { text: 'labs["doubled"] =', cls: "silent-line" },
    { text: '  labs["result"] * 2', cls: "silent-line" },
    { text: "", cls: "" },
    { text: "print(labs)", cls: "" },
    { text: "", cls: "" },
    { text: "  patient_id    result  doubled", cls: "output" },
    { text: "  A               5.2     10.4", cls: "output" },
    { text: "  B         MISSING  MISSINGMISSING", cls: "output-error" },
    { text: "  C               7.1     14.2", cls: "output" },
  ],
  outcome: "Silent continuation",
  outcomeClass: "outcome-silent",
  detail: "String repetition — no error or warning",
};

const tidyverse = {
  label: "Tidyverse (R)",
  code: [
    { text: "labs <- tibble(", cls: "" },
    { text: '  patient_id = c("A", "B", "C"),', cls: "" },
    { text: '  result = c(5.2, "MISSING", 7.1)', cls: "" },
    { text: ")", cls: "" },
    { text: "", cls: "" },
    { text: "analyzed <- labs %>%", cls: "silent-line" },
    { text: "  mutate(doubled = result * 2)", cls: "silent-line" },
    { text: "", cls: "" },
    { text: "# Runtime error:", cls: "error-msg" },
    { text: "# Error in `mutate()`:", cls: "error-msg" },
    { text: "# non-numeric argument to", cls: "error-msg" },
    { text: "# binary operator", cls: "error-msg" },
  ],
  outcome: "Runtime error",
  outcomeClass: "outcome-runtime",
  detail: "Error occurs only when code is executed",
};

function renderPanel(panel: typeof tidyTs): string {
  const lines = panel.code.map((line) => {
    const content = (line as { raw?: boolean }).raw ? line.text : (esc(line.text) || "&nbsp;");
    const cls = line.cls ? ` ${line.cls}` : "";
    return `<div class="code-line${cls}">${content}</div>`;
  }).join("\n");

  return `
    <div class="panel">
      <div class="panel-header">${esc(panel.label)}</div>
      <div class="code-block">${lines}</div>
      <div class="outcome ${panel.outcomeClass}">
        <span class="outcome-label">${esc(panel.outcome)}</span>
        <span class="outcome-detail">${esc(panel.detail)}</span>
      </div>
    </div>`;
}

const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Figure 3. Arithmetic on a Mixed-Type Column</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    background: #fff; display: flex; flex-direction: column; align-items: center;
    padding: 16px 24px; color: #1a1a2e;
  }
  .panels { display: flex; gap: 10px; max-width: 960px; width: 100%; align-items: stretch; }
  .panel { flex: 1; border: 1.5px solid #ddd; border-radius: 6px; display: flex; flex-direction: column; overflow: hidden; }
  .panel-header {
    background: #f5f5f5; border-bottom: 1px solid #ddd;
    padding: 8px 12px; font-size: 12px; font-weight: 600; text-align: center;
  }
  .code-block {
    flex: 1; padding: 10px 12px; font-family: "SF Mono", "Fira Code", "Cascadia Code", Menlo, monospace;
    font-size: 9.5px; line-height: 1.5; background: #fafafa;
  }
  .code-line { white-space: pre; }
  .code-line.comment { color: #6a737d; }
  .code-line.error-line { background: #fdd; color: #b31d28; font-weight: 600; }
  .squiggle { text-decoration: wavy underline #cb2431; text-underline-offset: 2px; }
  .code-line.error-msg { color: #cb2431; font-style: italic; }
  .code-line.silent-line { background: #fff8e1; }
  .code-line.output { color: #555; background: #f0f0f0; font-size: 9px; }
  .code-line.output-error { color: #c00; background: #f0f0f0; font-size: 9px; font-weight: 600; }
  .outcome {
    padding: 8px 12px; border-top: 1px solid #ddd; display: flex;
    flex-direction: column; gap: 2px;
  }
  .outcome-label { font-size: 11px; font-weight: 700; }
  .outcome-detail { font-size: 10px; color: #555; }
  .outcome-compile { background: #e8f5e9; }
  .outcome-compile .outcome-label { color: #2a7a2a; }
  .outcome-silent { background: #fde8e8; }
  .outcome-silent .outcome-label { color: #c00; }
  .outcome-runtime { background: #fff3e0; }
  .outcome-runtime .outcome-label { color: #e65100; }
</style>
</head>
<body>
<div class="panels">
${renderPanel(tidyTs)}
${renderPanel(pandas)}
${renderPanel(tidyverse)}
</div>
</body>
</html>`;

await Deno.writeTextFile(OUT, html);
console.log(`Wrote ${OUT}`);

const PNG = OUT.replace(".html", ".png");
const SCREENSHOT = resolve(DIR, "html-to-png.ts");
const p = new Deno.Command("deno", {
  args: ["run", "--no-config", "-A", SCREENSHOT, OUT, PNG, "960"],
  stdout: "inherit",
  stderr: "inherit",
});
const { code } = await p.output();
if (code !== 0) console.error("PNG screenshot failed");
