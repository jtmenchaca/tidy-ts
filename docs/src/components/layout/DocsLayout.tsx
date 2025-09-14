import type { ReactNode } from "react";
import { AppSidebar } from "./AppSidebar.tsx";
import { SidebarInset } from "../ui/sidebar.tsx";
import { Badge } from "../ui/badge.tsx";

interface DocsLayoutProps {
  children: ReactNode;
  title: string;
  description?: string;
  badge?: string;
}

export function DocsLayout(
  { children, title, description, badge }: DocsLayoutProps,
) {
  return (
    <div className="flex h-screen">
      <AppSidebar />
      <SidebarInset className="flex-1">
        <header className="border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60 sticky top-0 z-40">
          <div className="p-6">
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold text-gray-900">
                {title}
              </h1>
              {badge && (
                <Badge variant="secondary" className="text-xs">
                  {badge}
                </Badge>
              )}
            </div>
            {description && (
              <p className="text-lg text-gray-600 mt-2">
                {description}
              </p>
            )}
          </div>
        </header>
        <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-y-auto">
          <div className="container mx-auto max-w-none space-y-6 md:space-y-8">
            {children}
          </div>
        </main>
      </SidebarInset>
    </div>
  );
}
