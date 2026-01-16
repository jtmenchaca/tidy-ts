import * as React from "react";
import { type ReactNode } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./card.tsx";
import { createHighlighterCore } from "shiki/core";
import { createOnigurumaEngine } from "shiki/engine/oniguruma";
import { transformerNotationDiff } from "@shikijs/transformers";
import { CopyButton } from "./copy-button.tsx";

// Import only the specific themes we need
import githubLight from "@shikijs/themes/github-light";
import tokyoNight from "@shikijs/themes/tokyo-night";

interface CodeBlockProps {
  id?: string;
  title?: string;
  description?: string;
  code: string;
  language?: string;
  children?: ReactNode;
  explanation?: string;
}

// Cache for the highlighter
const cache = <T extends (...args: any[]) => any>(fn: T) => {
  const cache = new Map<string, any>();
  return async (...args: Parameters<T>) => {
    const key = JSON.stringify(args);
    if (cache.has(key)) {
      return cache.get(key);
    }
    const value = await fn(...args);
    cache.set(key, value);
    return value;
  };
};

// Create highlighter with only the specific themes we need
// Languages will be loaded dynamically to reduce initial bundle size
const highlighterPromise = createHighlighterCore({
  themes: [githubLight, tokyoNight],
  langs: [
    // Load only the most common languages initially
    () => import('@shikijs/langs/typescript'),
    () => import('@shikijs/langs/javascript'),
    () => import('@shikijs/langs/json'),
    () => import('@shikijs/langs/markdown'),
    () => import('@shikijs/langs/html'),
    () => import('@shikijs/langs/css'),
    // Load other languages dynamically when needed
    () => import('@shikijs/langs/bash'),
    () => import('@shikijs/langs/python'),
    () => import('@shikijs/langs/sql'),
    () => import('@shikijs/langs/yaml')
  ],
  engine: createOnigurumaEngine(import('shiki/wasm'))
});

const getHighlighter = cache(async (language: string) => {
  const highlighter = await highlighterPromise;
  
  // Load language dynamically if not already loaded
  const loadedLanguages = highlighter.getLoadedLanguages();
  if (!loadedLanguages.includes(language as any)) {
    await highlighter.loadLanguage(language as any);
  }
  
  return highlighter;
});

export function CodeBlock(
  { id, title, description, code, language = "typescript", children, explanation }:
    CodeBlockProps,
) {
  const [highlightedHtml, setHighlightedHtml] = React.useState<string>("");

  React[
    typeof document !== "undefined" ? "useLayoutEffect" : "useEffect"
  ](() => {
    (async () => {
      let lang = language;
      if (lang === "diff") {
        lang = "plaintext";
      }

      const themes = ["github-light", "tokyo-night"];

      try {
        const highlighter = await getHighlighter(lang);

        const htmls = await Promise.all(
          themes.map((theme) =>
            highlighter.codeToHtml(code, {
              lang,
              theme,
              transformers: [transformerNotationDiff()],
            })
          ),
        );

        setHighlightedHtml(htmls.join(""));
      } catch (error) {
        // Fallback to basic styling if highlighting fails
        console.warn("Syntax highlighting failed:", error);
        setHighlightedHtml("");
      }
    })();
  }, [code, language]);

  const codeElement = highlightedHtml ? (
    <div className="relative w-full group [&_pre]:!p-4 [&_pre]:!m-0 [&_pre]:!rounded-md [&_pre]:!overflow-x-auto [&_pre]:!text-xs [&_pre]:!font-mono [&_pre]:!bg-[rgb(246,248,250)] dark:[&_pre]:!bg-[rgb(20,20,20)]">
      <CopyButton text={code} />
      <div
        className="[&>pre.shiki:first-child]:block [&>pre.shiki:last-child]:hidden dark:[&>pre.shiki:first-child]:hidden dark:[&>pre.shiki:last-child]:block"
        dangerouslySetInnerHTML={{ __html: highlightedHtml }}
      />
    </div>
  ) : (
    <div className="relative w-full group">
      <CopyButton text={code} />
      <pre className="p-4 rounded-md overflow-x-auto text-xs font-mono bg-[rgb(246,248,250)] dark:bg-[rgb(20,20,20)]">
        <code>{code}</code>
      </pre>
    </div>
  );

  if (title || description) {
    return (
      <Card id={id}>
        {(title || description) && (
          <CardHeader>
            {title && <CardTitle>{title}</CardTitle>}
            {description && <CardDescription>{description}</CardDescription>}
          </CardHeader>
        )}
        <CardContent>
          {explanation && <p className="mb-4">{explanation}</p>}
          {children}
          {codeElement}
        </CardContent>
      </Card>
    );
  }

  return codeElement;
}
