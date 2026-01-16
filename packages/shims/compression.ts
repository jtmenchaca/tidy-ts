/**
 * Compression Stream API polyfill for environments without native support
 *
 * Provides CompressionStream and DecompressionStream using Node.js zlib
 * for environments like Bun that don't have native Web Streams Compression API.
 *
 * This polyfill is automatically installed when imported, ensuring compression
 * APIs are available before they're used.
 */

import { currentRuntime, Runtime } from "./detect.ts";

/**
 * Initialize compression stream polyfills if needed
 * This runs automatically when the module is imported
 */
function initCompressionPolyfill(): void {
  // Skip if APIs already exist
  if (
    typeof CompressionStream !== "undefined" &&
    typeof DecompressionStream !== "undefined"
  ) {
    return;
  }

  // Only polyfill for Node.js-compatible environments (Node.js, Bun)
  // Deno and modern browsers have native support
  if (currentRuntime !== Runtime.Node && currentRuntime !== Runtime.Bun) {
    return;
  }

  try {
    let zlib: typeof import("node:zlib");
    let stream: typeof import("node:stream");

    // Try require first (works in CommonJS, Node.js, and Bun)
    // Bun exposes require even in ESM mode, but check multiple ways
    // @ts-ignore - require may not be typed in all environments
    if (typeof require !== "undefined") {
      try {
        // @ts-ignore - require may not be typed in all environments
        zlib = require("node:zlib");
        // @ts-ignore - require may not be typed in all environments
        stream = require("node:stream");
      } catch {
        // If require exists but fails, we can't polyfill synchronously
        // This will be handled by async initialization
        return;
      }
    } else if (currentRuntime === Runtime.Bun) {
      // For Bun, try to access Bun's built-in require
      // @ts-ignore - Bun may expose require differently
      const bunRequire = (globalThis as { Bun?: { require?: typeof require } })
        .Bun?.require;
      if (bunRequire) {
        try {
          // @ts-ignore - Bun require may not be typed
          zlib = bunRequire("node:zlib");
          // @ts-ignore - Bun require may not be typed
          stream = bunRequire("node:stream");
        } catch {
          return;
        }
      } else {
        // No require available - can't polyfill synchronously
        // This will be handled by async initialization
        return;
      }
    } else {
      // No require available - can't polyfill synchronously
      return;
    }

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

// Initialize synchronously - works for Node.js and Bun (both have require)
initCompressionPolyfill();

// Fallback: For Bun in pure ESM mode without require, try async initialization
// This is a safety net in case require isn't available
if (
  currentRuntime === Runtime.Bun &&
  (typeof CompressionStream === "undefined" ||
    typeof DecompressionStream === "undefined")
) {
  // Bun should have require, but if not, this will handle it
  // Note: This is async, so it may not be available immediately
  // In practice, Bun should have require available
  (async () => {
    try {
      const zlib = await import("node:zlib");
      const stream = await import("node:stream");

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
      // If async import also fails, compression won't be available
    }
  })();
}
