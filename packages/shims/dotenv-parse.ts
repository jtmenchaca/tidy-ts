// Copyright 2018-2025 the Deno authors. MIT license.
// Adapted for cross-runtime compatibility using @tidy-ts/shims

import { env } from "./env.ts";

type LineParseResult = {
  key: string;
  unquoted: string;
  interpolated: string;
  notInterpolated: string;
};

type CharactersMap = { [key: string]: string };

const RE_KEY_VALUE =
  /^\s*(?:export\s+)?(?<key>[^\s=#]+?)\s*=[\ \t]*('\r?\n?(?<notInterpolated>(.|\r\n|\n)*?)\r?\n?'|"\r?\n?(?<interpolated>(.|\r\n|\n)*?)\r?\n?"|(?<unquoted>[^\r\n#]*)) *#*.*$/gm;

const RE_VALID_KEY = /^[a-zA-Z_][a-zA-Z0-9_]*$/;

const RE_EXPAND_VALUE =
  /(\${(?<inBrackets>.+?)(\:-(?<inBracketsDefault>.+))?}|(?<!\\)\$(?<notInBrackets>\w+)(\:-(?<notInBracketsDefault>.+))?)/g;

function expandCharacters(str: string): string {
  const charactersMap: CharactersMap = {
    "\\n": "\n",
    "\\r": "\r",
    "\\t": "\t",
  };

  return str.replace(
    /\\([nrt])/g,
    ($1: keyof CharactersMap): string => charactersMap[$1] ?? "",
  );
}

function expand(str: string, variablesMap: { [key: string]: string }): string {
  if (RE_EXPAND_VALUE.test(str)) {
    return expand(
      str.replace(RE_EXPAND_VALUE, function (...params) {
        const {
          inBrackets,
          inBracketsDefault,
          notInBrackets,
          notInBracketsDefault,
        } = params[params.length - 1];
        const expandValue = inBrackets || notInBrackets;
        const defaultValue = inBracketsDefault || notInBracketsDefault;

        let value: string | undefined = variablesMap[expandValue];
        if (value === undefined) {
          // Use cross-runtime env instead of Deno.env
          value = env.get(expandValue);
        }
        return value === undefined ? expand(defaultValue, variablesMap) : value;
      }),
      variablesMap,
    );
  } else {
    return str;
  }
}

/**
 * Parse `.env` file content into an object.
 *
 * This is an internal utility used by `env.loadFromFile()` and `env.loadFromFileSync()`.
 * For loading `.env` files, use those methods instead.
 *
 * Note: The key needs to match the pattern /^[a-zA-Z_][a-zA-Z0-9_]*$/.
 *
 * @example Parse dotenv string
 * ```ts
 * import { parse } from "@tidy-ts/shims/dotenv-parse";
 *
 * const config = parse("GREETING=hello world\nPORT=3000");
 * console.log(config.GREETING); // "hello world"
 * ```
 *
 * @example Load from file (recommended)
 * ```ts
 * import { env } from "@tidy-ts/shims";
 *
 * // Load and export to environment
 * await env.loadFromFile(".env");
 *
 * // Load without exporting
 * const config = await env.loadFromFile(".env", { export: false });
 * ```
 *
 * @param text The dotenv-formatted text to parse.
 * @returns A record of parsed environment variables.
 */
export function parse(text: string): Record<string, string> {
  const envVars: Record<string, string> = Object.create(null);

  let match;
  const keysForExpandCheck = [];

  while ((match = RE_KEY_VALUE.exec(text)) !== null) {
    const { key, interpolated, notInterpolated, unquoted } = match
      ?.groups as LineParseResult;

    if (!RE_VALID_KEY.test(key)) {
      // Skip invalid keys silently
      continue;
    }

    if (unquoted) {
      keysForExpandCheck.push(key);
    }

    envVars[key] = typeof notInterpolated === "string"
      ? notInterpolated
      : typeof interpolated === "string"
      ? expandCharacters(interpolated)
      : unquoted.trim();
  }

  //https://github.com/motdotla/dotenv-expand/blob/ed5fea5bf517a09fd743ce2c63150e88c8a5f6d1/lib/main.js#L23
  const variablesMap = { ...envVars };
  keysForExpandCheck.forEach((key) => {
    envVars[key] = expand(envVars[key]!, variablesMap);
  });

  return envVars;
}
