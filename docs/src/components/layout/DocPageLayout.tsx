import React from "react";
import { DocNavigation } from "../navigation/DocNavigation.tsx";

interface DocPageLayoutProps {
  title: string;
  description: string;
  children: React.ReactNode;
  currentPath: string;
  maxWidth?: string;
}

export function DocPageLayout({
  title,
  description,
  children,
  currentPath,
  maxWidth = "max-w-4xl",
}: DocPageLayoutProps) {
  return (
    <div className="flex-1 p-8 overflow-y-auto">
      <div className={`${maxWidth} mx-auto space-y-8`}>
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            {title}
          </h1>
          <p className="text-base text-gray-600 dark:text-gray-400">
            {description}
          </p>
        </div>

        {children}

        {/* Navigation */}
        <DocNavigation currentPath={currentPath} />
      </div>
    </div>
  );
}
