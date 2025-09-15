import { GithubIcon, MenuIcon } from "lucide-react";
import {
  SidebarInset,
  SidebarProvider as UISidebarProvider,
  SidebarTrigger,
} from "../ui/sidebar.tsx";
import { AppSidebar } from "./AppSidebar.tsx";
import { ThemeToggle } from "../theme/ThemeToggle.tsx";
import { Button } from "../ui/button.tsx";
import { SearchTrigger } from "../search/SearchTrigger.tsx";
import { useSearch } from "../search/SearchProvider.tsx";
import { Link } from "@tanstack/react-router";
import React from "react";
import TidyTsLogo from "../../assets/tidy-ts-logo.svg";

interface SidebarProviderProps {
  children: React.ReactNode;
  defaultOpen?: boolean;
}

export function SidebarProvider(
  { children, defaultOpen = false }: SidebarProviderProps,
) {
  const { toggle } = useSearch();

  return (
    <UISidebarProvider defaultOpen={defaultOpen}>
      <div className="flex w-full overflow-hidden min-h-screen">
        <AppSidebar variant="inset" className="border-r" />
        <SidebarInset className="flex flex-col">
          {/* Header with search and controls */}
          <header className="flex h-[60px] items-center justify-between bg-white dark:bg-gray-900 px-3 lg:px-4 border-b min-w-0 sticky top-0 z-40">
            <div className="flex items-center flex-1 min-w-0 gap-4 lg:gap-6">
              <SidebarTrigger
                className="hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md p-2 flex-shrink-0"
                aria-label="Toggle sidebar"
              >
                <MenuIcon className="h-7 w-7" aria-hidden="true" />
              </SidebarTrigger>

              {/* Logo and Brand */}
              {/* @ts-ignore TS thinks you need search prop */}
              <Link
                to="/"
                className="hover:opacity-75 transition-opacity flex items-center gap-2 lg:gap-3 flex-shrink-0"
              >
                <div className="flex items-center gap-1">
                  <img 
                    src={TidyTsLogo} 
                    alt="Tidy-TS Logo" 
                    className="h-10 w-10"
                  />
                </div>
                <div className="hidden md:block">
                  <h1 className="font-semibold text-gray-900 dark:text-gray-100 text-lg">
                    Tidy-TS
                  </h1>
                </div>
              </Link>

              {/* Search Bar */}
              <div className="flex-1 min-w-0">
                <SearchTrigger
                  onClick={toggle}
                  className="w-full max-w-sm justify-start"
                />
              </div>
            </div>

            <div className="flex items-center gap-1 lg:gap-2 flex-shrink-0">
              <Button
                variant="ghost"
                size="sm"
                asChild
                className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
              >
                <a
                  href="https://github.com/jtmenchaca/tidy-ts"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 lg:gap-2"
                >
                  <GithubIcon className="w-5 h-5" />
                  <span className="hidden lg:inline">GitHub</span>
                </a>
              </Button>
              <ThemeToggle />
            </div>
          </header>

          {/* Main Content Area */}
          <main className="flex-1 bg-white dark:bg-gray-900 overflow-y-auto min-w-0">
            {children}
          </main>
        </SidebarInset>
      </div>
    </UISidebarProvider>
  );
}
