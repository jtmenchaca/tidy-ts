# Cross-Runtime Dotenv

Cross-runtime environment variable loading from `.env` files, compatible with Deno, Bun, and Node.js.

## Features

- **Parse dotenv strings** - Convert `.env` format to objects
- **Load from files** - Async and sync file loading
- **Environment export** - Optionally export to process environment
- **Variable expansion** - Support for `$VAR` and `${VAR}` syntax
- **Default values** - Use `${VAR:-default}` for fallbacks
- **Full compatibility** - Works identically across all runtimes

## Quick Start

### Using env.loadFromFile (recommended)

Create a `.env` file:
```env
DATABASE_URL=postgresql://localhost/mydb
API_KEY=secret123
```

Load it:
```ts
import { env } from "@tidy-ts/shims";

await env.loadFromFile(".env");
console.log(env.get("DATABASE_URL")); // postgresql://localhost/mydb
```

### Manual loading with load()

```ts
import { load } from "@tidy-ts/shims";

// Load without exporting
const config = await load();
console.log(config.DATABASE_URL);

// Load and export to environment
await load({ export: true });
console.log(env.get("API_KEY"));
```

### Parse strings

```ts
import { parse } from "@tidy-ts/shims";

const config = parse("PORT=3000\nHOST=localhost");
console.log(config.PORT); // "3000"
```

## API

### `load(options?)`

Asynchronously load environment variables from a `.env` file.

**Options:**
- `envPath` - Path to `.env` file (default: `"./.env"`)
- `export` - Export to process environment (default: `false`)

```ts
const config = await load({
  envPath: ".env.production",
  export: true
});
```

### `loadSync(options?)`

Synchronously load environment variables.

```ts
const config = loadSync({
  envPath: ".env.local"
});
```

### `parse(text)`

Parse a dotenv-formatted string into an object.

```ts
const config = parse("KEY=value\nOTHER=data");
```

## Features

### Variable Expansion

```env
BASE_PATH=/var/app
DATA_DIR=${BASE_PATH}/data
LOGS_DIR=${BASE_PATH}/logs
```

```ts
const config = await load();
console.log(config.DATA_DIR); // "/var/app/data"
```

### Default Values

```env
PORT=${PORT:-3000}
HOST=${HOST:-localhost}
```

If `PORT` isn't set in the environment, it defaults to `3000`.

### Multiline Values

```env
PRIVATE_KEY="-----BEGIN RSA PRIVATE KEY-----
MIIEpAIBAAKCAQEA...
-----END RSA PRIVATE KEY-----"
```

### Quoted Values

```env
SINGLE='single quoted'
DOUBLE="double quoted"
JSON='{"foo": "bar"}'
```

### Comments

```env
# This is a comment
DATABASE_URL=postgresql://localhost/mydb  # inline comment
```

## Cross-Runtime Compatibility

This implementation uses `@tidy-ts/shims` internally, making it work seamlessly across:

- **Deno** - Uses `Deno.readTextFile()` and `Deno.env`
- **Bun** - Uses `node:fs/promises` and `process.env`
- **Node.js** - Uses `node:fs/promises` and `process.env`

## Credits

Adapted from [@std/dotenv](https://jsr.io/@std/dotenv) with cross-runtime compatibility using `@tidy-ts/shims`.
