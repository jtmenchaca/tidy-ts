import { CompressionStream, DecompressionStream } from "./facade.js";

globalThis.CompressionStream ??= CompressionStream;

globalThis.DecompressionStream ??= DecompressionStream;
