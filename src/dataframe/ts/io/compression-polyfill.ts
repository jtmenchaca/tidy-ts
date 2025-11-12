/**
 * Polyfill for CompressionStream and DecompressionStream using Node.js zlib
 *
 * This polyfill enables compression/decompression in environments that don't
 * support the Web Streams Compression API (e.g., Bun, older Node.js versions).
 *
 * Based on: https://github.com/jimmywarting/CompressionStream
 * MIT License. Jimmy Wärting <https://jimmy.warting.se/opensource>
 */

// Only polyfill if the APIs don't exist and we're in a Node.js-compatible environment
// Check for Node.js/Bun environment by looking for globalThis.require or checking for Deno
const isNodeOrBun = typeof globalThis !== "undefined" &&
  (typeof (globalThis as { require?: unknown }).require !== "undefined" ||
    (typeof Deno === "undefined" && typeof window === "undefined"));

if (
  (typeof CompressionStream === "undefined" ||
    typeof DecompressionStream === "undefined") &&
  isNodeOrBun
) {
  try {
    // Use require for synchronous loading in Node.js/Bun environments
    // This ensures the polyfill is available immediately
    // @ts-ignore - require may not be typed in all environments
    const zlib = require("node:zlib");
    // @ts-ignore - require may not be typed in all environments
    const stream = require("node:stream");

    // deno-lint-ignore no-explicit-any
    const make = (ctx: any, handle: any) =>
      Object.assign(ctx, {
        readable: stream.Readable.toWeb(handle),
        writable: stream.Writable.toWeb(handle),
      });

    if (typeof CompressionStream === "undefined") {
      globalThis.CompressionStream = class CompressionStream {
        readable!: ReadableStream<Uint8Array>;
        writable!: WritableStream<Uint8Array>;

        constructor(format: string) {
          const zlibStream = format === "deflate"
            ? zlib.createDeflate()
            : format === "gzip"
            ? zlib.createGzip()
            : zlib.createDeflateRaw();
          make(this, zlibStream);
        }
      } as typeof CompressionStream;
    }

    if (typeof DecompressionStream === "undefined") {
      globalThis.DecompressionStream = class DecompressionStream {
        readable!: ReadableStream<Uint8Array>;
        writable!: WritableStream<Uint8Array>;

        constructor(format: string) {
          const zlibStream = format === "deflate"
            ? zlib.createInflate()
            : format === "gzip"
            ? zlib.createGunzip()
            : zlib.createInflateRaw();
          make(this, zlibStream);
        }
      } as typeof DecompressionStream;
    }
  } catch (_e) {
    // If zlib is not available, the polyfill won't be installed
    // The code will throw a clear error when trying to use compression
  }
}
