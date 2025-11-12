import * as localThis from "./facade.js";

export const CompressionStream = globalThis.CompressionStream ??
  localThis.CompressionStream;

export const DecompressionStream = globalThis.DecompressionStream ??
  localThis.DecompressionStream;
