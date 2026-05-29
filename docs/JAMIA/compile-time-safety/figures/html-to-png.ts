/**
 * Standalone HTML-to-PNG screenshot utility.
 * Usage: deno run -A /tmp/html-to-png.ts <input.html> <output.png> [width]
 */
import puppeteer from "npm:puppeteer-core";

const [htmlPath, pngPath, widthStr] = Deno.args;
if (!htmlPath || !pngPath) {
  console.error("Usage: html-to-png.ts <input.html> <output.png> [width]");
  Deno.exit(1);
}

const width = parseInt(widthStr || "900");
const html = await Deno.readTextFile(htmlPath);

const browser = await puppeteer.launch({
  executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  headless: true,
  args: ["--no-sandbox"],
});
const page = await browser.newPage();
await page.setViewport({ width, height: 800, deviceScaleFactor: 2 });
await page.setContent(html, { waitUntil: "networkidle0" });
const body = await page.$("body");
await body!.screenshot({ path: pngPath, type: "png" });
await browser.close();
console.log(`Wrote ${pngPath}`);
