import { ThemeToggle } from "../theme/ThemeToggle.tsx";

interface PageHeaderProps {
  title?: string;
  subtitle?: string;
}

export function PageHeader({ title, subtitle }: PageHeaderProps) {
  return (
    <header className="sticky top-0 z-40 w-full border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60 dark:bg-gray-900/95 dark:supports-[backdrop-filter]:bg-gray-900/60 dark:border-gray-800">
      <div className="container flex h-14 items-center px-8">
        <div className="flex flex-1 items-center justify-between">
          <div className="flex items-center space-x-2">
            {title && (
              <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                {title}
              </h1>
            )}
            {subtitle && (
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {subtitle}
              </span>
            )}
          </div>
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
