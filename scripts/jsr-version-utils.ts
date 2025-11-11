/**
 * Utility functions for checking JSR package versions programmatically
 *
 * @example
 * ```ts
 * import { getLatestVersion } from "./scripts/jsr-version-utils.ts";
 *
 * const version = await getLatestVersion("tidy-ts", "dataframe");
 * console.log(version); // "1.0.29"
 * ```
 */

export interface PackageMetadata {
  scope: string;
  name: string;
  latest?: string;
  versions: Record<string, {
    yanked?: boolean;
    createdAt?: string;
  }>;
}

/**
 * Get the latest published version of a JSR package
 *
 * @param scope - Package scope (e.g., "tidy-ts")
 * @param packageName - Package name (e.g., "dataframe")
 * @returns Latest version string, or null if package doesn't exist or hasn't been published
 *
 * @example
 * ```ts
 * const version = await getLatestVersion("tidy-ts", "dataframe");
 * if (version) {
 *   console.log(`Latest version: ${version}`);
 * }
 * ```
 */
export async function getLatestVersion(
  scope: string,
  packageName: string,
): Promise<string | null> {
  const url = `https://jsr.io/@${scope}/${packageName}/meta.json`;

  try {
    const response = await fetch(url, {
      headers: {
        "Accept": "application/json",
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        return null; // Package doesn't exist or hasn't been published
      }
      throw new Error(
        `Failed to fetch metadata: ${response.status} ${response.statusText}`,
      );
    }

    const metadata: PackageMetadata = await response.json();

    // Use the 'latest' field if available (JSR provides this)
    if (metadata.latest) {
      return metadata.latest;
    }

    // Fallback: Get all non-yanked versions and find the latest
    const versions = Object.entries(metadata.versions)
      .filter(([_, info]) => !info.yanked)
      .map(([version]) => version);

    if (versions.length === 0) {
      return null;
    }

    // Sort versions semantically and return the latest
    const sortedVersions = versions.sort((a, b) => {
      const aParts = a.split(".").map(Number);
      const bParts = b.split(".").map(Number);

      for (let i = 0; i < Math.max(aParts.length, bParts.length); i++) {
        const aPart = aParts[i] || 0;
        const bPart = bParts[i] || 0;
        if (aPart !== bPart) {
          return bPart - aPart; // Descending order
        }
      }
      return 0;
    });

    return sortedVersions[0];
  } catch (error) {
    throw new Error(
      `Error fetching ${scope}/${packageName}: ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
  }
}

/**
 * Get full package metadata from JSR
 *
 * @param scope - Package scope (e.g., "tidy-ts")
 * @param packageName - Package name (e.g., "dataframe")
 * @returns Package metadata object, or null if package doesn't exist
 *
 * @example
 * ```ts
 * const metadata = await getPackageMetadata("tidy-ts", "dataframe");
 * if (metadata) {
 *   console.log(`Latest: ${metadata.latest}`);
 *   console.log(`Total versions: ${Object.keys(metadata.versions).length}`);
 * }
 * ```
 */
export async function getPackageMetadata(
  scope: string,
  packageName: string,
): Promise<PackageMetadata | null> {
  const url = `https://jsr.io/@${scope}/${packageName}/meta.json`;

  try {
    const response = await fetch(url, {
      headers: {
        "Accept": "application/json",
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      throw new Error(
        `Failed to fetch metadata: ${response.status} ${response.statusText}`,
      );
    }

    return await response.json();
  } catch (error) {
    throw new Error(
      `Error fetching ${scope}/${packageName}: ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
  }
}
