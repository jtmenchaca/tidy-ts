import { Readable, Writable } from "node:stream";
import zlib from "node:zlib";

const compression = {
  "deflate": zlib.createDeflate,
  "deflate-raw": zlib.createDeflateRaw,
  "gzip": zlib.createGzip,
};

export class CompressionStream {
  constructor(format) {
    const handle = compression[format]();
    this.readable = Readable.toWeb(handle);
    this.writable = Writable.toWeb(handle);
  }
}

const decompression = {
  "deflate": zlib.createInflate,
  "deflate-raw": zlib.createInflateRaw,
  "gzip": zlib.createGunzip,
};

export class DecompressionStream {
  constructor(format) {
    const handle = decompression[format]();
    this.readable = Readable.toWeb(handle);
    this.writable = Writable.toWeb(handle);
  }
}
