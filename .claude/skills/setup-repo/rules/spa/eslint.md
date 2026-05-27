# ESLint

Tailwind/Deno cover formatting and most linting at the workspace level. ESLint adds React-specific rules (hooks lint, react-refresh) that the Deno linter does not.

## `packages/<pkg>/eslint.config.js`

Flat config format. ESM.

```js
import js from "@eslint/js";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import globals from "globals";
import tseslint from "typescript-eslint";

export default tseslint.config(
  { ignores: ["dist"] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "react-refresh/only-export-components": [
        "warn",
        { allowConstantExport: true },
      ],
    },
  },
);
```

## Required devDependencies

These must be in the package's `devDependencies` (with `"*"`) and present in root + overrides:

- `eslint`
- `@eslint/js`
- `eslint-plugin-react-hooks`
- `eslint-plugin-react-refresh`
- `typescript-eslint`
- `globals`

ESLint is **not** wired into a `lint` script by default — the workspace already has `pnpm lint` running `deno lint`. If the user wants `eslint` run on commit or in CI, add a per-package `lint` script or wire it into the root `check`.
