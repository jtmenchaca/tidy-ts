# Tailwind 4 + shadcn/ui

Tailwind 4 uses the `@tailwindcss/vite` plugin and configures itself **inline in CSS** via `@theme` — there is no `tailwind.config.ts`. shadcn/ui is wired up but **no components are pre-installed**. The user runs `npx shadcn add <name>` for each component they need.

## `src/index.css`

Copy the full starter from [assets/index.css](assets/index.css). It contains:

- `@import "tailwindcss"` + `@plugin "tailwindcss-animate"` + `@custom-variant dark (&:is(.dark *))`
- `:root` and `.dark` blocks defining `oklch()` CSS variables for the shadcn neutral palette
- `@theme inline { ... }` block mapping those variables to Tailwind tokens (`--color-background`, `--radius-md`, etc.)
- Accordion + shimmer keyframes
- `@layer base` with `border-border`/`outline-ring/50` defaults, body font stack, `.hide-scrollbar`, and pointer-cursor rules for interactive elements + Radix triggers

The `.dark` block is included by default — it costs nothing if unused, and it's wired up the moment the user adds a theme toggle. Dark-mode toggling itself (next-themes, theme provider) is not scaffolded; users add it when they need it.

## `components.json`

```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "new-york",
  "rsc": false,
  "tsx": true,
  "tailwind": {
    "config": "",
    "css": "src/index.css",
    "baseColor": "neutral",
    "cssVariables": true,
    "prefix": ""
  },
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils",
    "ui": "@/components/ui",
    "lib": "@/lib",
    "hooks": "@/hooks"
  },
  "iconLibrary": "lucide"
}
```

The `@/*` aliases work because of the Vite alias + the `paths` block in `tsconfig.app.json` — both must be set.

## `src/lib/utils.ts`

shadcn components import `cn` from this file.

```ts
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

## Required deps

These must be in the package's `dependencies` (with `"*"`) and in root + overrides:

- `clsx`, `tailwind-merge`, `class-variance-authority` — `cn` helper + variant API used by shadcn components.
- `lucide-react` — icon library matching `components.json`.

devDependencies on the package:

- `tailwindcss`, `@tailwindcss/vite`, `tailwindcss-animate`

## Adding components

```bash
cd packages/<pkg>
npx shadcn add button card dialog
```

shadcn writes components to `src/components/ui/`. It will respect `components.json` aliases and use the CSS variables already defined in `index.css`.

## Common Gotchas

- **No `tailwind.config.ts`.** All theme config lives inside `@theme inline { ... }` in `index.css`. Adding a Tailwind v3 config file will be silently ignored.
- **`@apply` only works in CSS files Tailwind processes.** The `border-border` and `bg-background` utilities in `@layer base` require the `@import "tailwindcss"` directive at the top of the same file.
- **shadcn needs both aliases configured.** The Vite `@` alias **and** the `tsconfig.app.json` `paths` block must point to `./src`. If one is missing, generated imports break.
- **Don't commit `components.json` `config` field as anything non-empty.** Tailwind 4 has no config file — leave it `""`.
