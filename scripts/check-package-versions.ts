#!/usr/bin/env -S deno run --allow-net

/**
 * CLI to check the latest published version of packages on JSR or npm
 *
 * Usage:
 *   deno run --allow-net scripts/check-package-versions.ts jsr:@tidy-ts/dataframe
 *   deno run --allow-net scripts/check-package-versions.ts npm:lodash
 *   deno run --allow-net scripts/check-package-versions.ts jsr:@tidy-ts/dataframe npm:lodash
 *   deno task check-versions jsr:@tidy-ts/dataframe npm:lodash
 *
 * The core logic is also exposed via the tidy-get-package-version MCP tool.
 */

interface JsrMetadata {
  latest?: string;
  versions: Record<string, { yanked?: boolean }>;
}

interface NpmMetadata {
  "dist-tags": { latest?: string };
  versions: Record<string, unknown>;
}

function sortVersionsDesc(versions: string[]): string[] {
  return versions.sort((a, b) => {
    const aParts = a.split(".").map(Number);
    const bParts = b.split(".").map(Number);
    for (let i = 0; i < Math.max(aParts.length, bParts.length); i++) {
      if ((aParts[i] || 0) !== (bParts[i] || 0)) {
        return (bParts[i] || 0) - (aParts[i] || 0);
      }
    }
    return 0;
  });
}

async function getJsrVersion(
  scope: string,
  name: string,
): Promise<string | null> {
  const res = await fetch(`https://jsr.io/@${scope}/${name}/meta.json`);
  if (!res.ok) {
    return res.status === 404 ? null : Promise.reject(res.statusText);
  }
  const meta: JsrMetadata = await res.json();
  if (meta.latest) return meta.latest;
  const versions = Object.entries(meta.versions)
    .filter(([_, v]) => !v.yanked)
    .map(([ver]) => ver);
  return versions.length ? sortVersionsDesc(versions)[0] : null;
}

async function getNpmVersion(name: string): Promise<string | null> {
  const res = await fetch(`https://registry.npmjs.org/${name}`);
  if (!res.ok) {
    return res.status === 404 ? null : Promise.reject(res.statusText);
  }
  const meta: NpmMetadata = await res.json();
  if (meta["dist-tags"]?.latest) return meta["dist-tags"].latest;
  const versions = Object.keys(meta.versions);
  return versions.length ? sortVersionsDesc(versions)[0] : null;
}

type Parsed =
  | { registry: "jsr"; scope: string; name: string; display: string }
  | { registry: "npm"; name: string; display: string };

function parse(pkg: string): Parsed | null {
  const jsr = pkg.match(/^jsr:@([^/]+)\/(.+)$/);
  if (jsr) {
    return { registry: "jsr", scope: jsr[1], name: jsr[2], display: pkg };
  }
  const npm = pkg.match(/^npm:(.+)$/);
  if (npm) return { registry: "npm", name: npm[1], display: pkg };
  return null;
}

async function main() {
  const packages = Deno.args.length > 0
    ? Deno.args
    : ["jsr:@tidy-ts/dataframe", "jsr:@tidy-ts/ai", "jsr:@tidy-ts/shims"];

  console.log("Checking package versions...\n");

  for (const pkg of packages) {
    const p = parse(pkg);
    if (!p) {
      console.error(`Invalid: ${pkg}. Use jsr:@scope/name or npm:package-name`);
      continue;
    }
    try {
      const ver = p.registry === "jsr"
        ? await getJsrVersion(p.scope, p.name)
        : await getNpmVersion(p.name);
      console.log(ver ? `${p.display}: ${ver}` : `${p.display}: Not published`);
    } catch (e) {
      console.error(
        `${p.display}: Error - ${e instanceof Error ? e.message : e}`,
      );
    }
  }
}

if (import.meta.main) await main();
