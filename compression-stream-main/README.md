# compression-stream

A De/CompressionStream *poly* / *ponyfill* for Bun, based on [this issue](https://github.com/oven-sh/bun/issues/1723)'s ideas.

```js
// polyfill (globally patched)
import '@ungap/compression-stream/poly';
// CompressionStream & DecompressionStream now globally available

// ponyfill (no global patch)
import { CompressionStream, DecompressionStream } from '@ungap/compression-stream';
// CompressionStream & DecompressionStream native if available
```
