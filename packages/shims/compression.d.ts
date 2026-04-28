/**
 * Compression Stream API polyfill for environments without native support
 *
 * Provides CompressionStream and DecompressionStream using Node.js zlib
 * for environments like Bun that don't have native Web Streams Compression API.
 *
 * This polyfill is automatically installed when imported, ensuring compression
 * APIs are available before they're used.
 */
export {};
