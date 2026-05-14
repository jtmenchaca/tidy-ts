/**
 * Standalone HTML-to-TIFF screenshot utility for journal submission.
 * Usage: deno run -A docs/JAMIA/figures/html-to-tif.ts <input.html> <output.tif> [width]
 *
 * Renders at 4x device scale for 300+ DPI at print sizes.
 */
import puppeteer from "npm:puppeteer-core";
import sharp from "npm:sharp";

const [htmlPath, tifPath, widthStr] = Deno.args;
if (!htmlPath || !tifPath) {
  console.error("Usage: html-to-tif.ts <input.html> <output.tif> [width]");
  Deno.exit(1);
}

const width = parseInt(widthStr || "900");
const html = await Deno.readTextFile(htmlPath);

const browser = await puppeteer.launch({
  executablePath:
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  headless: true,
  args: ["--no-sandbox"],
});
const page = await browser.newPage();
await page.setViewport({ width, height: 800, deviceScaleFactor: 4 });
await page.setContent(html, { waitUntil: "networkidle0" });
const body = await page.$("body");
const pngBuffer = await body!.screenshot({ type: "png" });
await browser.close();

await sharp(pngBuffer)
  .tiff({ compression: "lzw" })
  .toFile(tifPath);

console.log(`Wrote ${tifPath}`);
