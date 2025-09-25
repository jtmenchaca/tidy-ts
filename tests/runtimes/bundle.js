import * as esbuild from 'esbuild';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

await esbuild.build({
  entryPoints: [join(__dirname, '../../src/dataframe/ts/index.ts')],
  bundle: true,
  format: 'iife',  // Use IIFE to avoid top-level await issues
  globalName: 'TidyDataFrame',  // Export as global variable
  outfile: join(__dirname, 'public/dataframe-bundle.js'),
  platform: 'browser',
  target: 'es2020',  // Use ES2020 for better compatibility
  external: [],
  loader: {
    '.wasm': 'file'
  },
  define: {
    'process.env.NODE_ENV': '"production"',
    'globalThis.process.env.NODE_ENV': '"production"'
  },
  minify: false,
  sourcemap: true,
  alias: {
    'node:fs': join(__dirname, 'empty-module.js'),
    'node:path': join(__dirname, 'empty-module.js'),
    'node:url': join(__dirname, 'empty-module.js'),
    'node:worker_threads': join(__dirname, 'empty-module.js')
  }
});

console.log('Bundle created at public/dataframe-bundle.js');