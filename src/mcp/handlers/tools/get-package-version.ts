import type { TidyMcp } from "../../index.ts";
import * as v from "valibot";

interface JsrPackageMetadata {
  scope: string;
  name: string;
  latest?: string;
  versions: Record<string, { yanked?: boolean; createdAt?: string }>;
}

interface NpmPackageMetadata {
  name: string;
  "dist-tags": { latest?: string; [tag: string]: string | undefined };
  versions: Record<string, unknown>;
}

function sortVersionsDescending(versions: string[]): string[] {
  return versions.sort((a, b) => {
    const aParts = a.split(".").map(Number);
    const bParts = b.split(".").map(Number);
    for (let i = 0; i < Math.max(aParts.length, bParts.length); i++) {
      const aPart = aParts[i] || 0;
      const bPart = bParts[i] || 0;
      if (aPart !== bPart) return bPart - aPart;
    }
    return 0;
  });
}

async function getLatestJsrVersion(
  scope: string,
  name: string,
): Promise<string | null> {
  const url = `https://jsr.io/@${scope}/${name}/meta.json`;
  const response = await fetch(url, {
    headers: { Accept: "application/json" },
  });

  if (!response.ok) {
    if (response.status === 404) return null;
    throw new Error(
      `Failed to fetch: ${response.status} ${response.statusText}`,
    );
  }

  const metadata: JsrPackageMetadata = await response.json();
  if (metadata.latest) return metadata.latest;

  const versions = Object.entries(metadata.versions)
    .filter(([_, info]) => !info.yanked)
    .map(([version]) => version);

  return versions.length > 0 ? sortVersionsDescending(versions)[0] : null;
}

async function getLatestNpmVersion(name: string): Promise<string | null> {
  const url = `https://registry.npmjs.org/${name}`;
  const response = await fetch(url, {
    headers: { Accept: "application/json" },
  });

  if (!response.ok) {
    if (response.status === 404) return null;
    throw new Error(
      `Failed to fetch: ${response.status} ${response.statusText}`,
    );
  }

  const metadata: NpmPackageMetadata = await response.json();
  if (metadata["dist-tags"]?.latest) return metadata["dist-tags"].latest;

  const versions = Object.keys(metadata.versions);
  return versions.length > 0 ? sortVersionsDescending(versions)[0] : null;
}

type ParsedPackage =
  | { registry: "jsr"; scope: string; name: string; display: string }
  | { registry: "npm"; name: string; display: string };

function parsePackage(pkg: string): ParsedPackage | null {
  const jsrMatch = pkg.match(/^jsr:@([^/]+)\/(.+)$/);
  if (jsrMatch) {
    const [, scope, name] = jsrMatch;
    return { registry: "jsr", scope, name, display: `jsr:@${scope}/${name}` };
  }

  const npmMatch = pkg.match(/^npm:(.+)$/);
  if (npmMatch) {
    const [, name] = npmMatch;
    return { registry: "npm", name, display: `npm:${name}` };
  }

  return null;
}

export function get_package_version(server: TidyMcp) {
  const schema = v.object({
    packages: v.pipe(
      v.array(v.string()),
      v.description(
        'Package specifiers with registry prefix. Format: "jsr:@scope/name" or "npm:package-name". Examples: ["jsr:@tidy-ts/dataframe", "npm:lodash"]',
      ),
    ),
  });

  type Input = v.InferInput<typeof schema>;

  server.tool(
    {
      name: "tidy-get-package-version",
      description:
        "Get the latest published version of packages from JSR or npm registries. Requires registry prefix (jsr: or npm:) on each package.",
      // deno-lint-ignore no-explicit-any
      schema: schema as any,
    },
    async ({ packages }: Input) => {
      const results: string[] = [];

      for (const pkg of packages) {
        const parsed = parsePackage(pkg);

        if (!parsed) {
          results.push(
            `${pkg}: Invalid format. Expected jsr:@scope/name or npm:package-name`,
          );
          continue;
        }

        try {
          const version = parsed.registry === "jsr"
            ? await getLatestJsrVersion(parsed.scope, parsed.name)
            : await getLatestNpmVersion(parsed.name);

          results.push(
            version === null
              ? `${parsed.display}: Not published yet`
              : `${parsed.display}: ${version}`,
          );
        } catch (error) {
          results.push(
            `${parsed.display}: Error - ${
              error instanceof Error ? error.message : String(error)
            }`,
          );
        }
      }

      return {
        content: [{ type: "text", text: results.join("\n") }],
      };
    },
  );
}
