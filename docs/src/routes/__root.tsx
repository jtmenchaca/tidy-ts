import { createRootRoute, Outlet } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import { NotFound } from "../components/layout/NotFound.tsx";
import { SidebarProvider } from "../components/layout/SidebarProvider.tsx";
import { ThemeProvider } from "../components/theme/ThemeProvider.tsx";
import { SearchProvider } from "../components/search/SearchProvider.tsx";
function RootComponent() {
  return (
    <ThemeProvider>
      <SearchProvider>
        <SidebarProvider defaultOpen={true}>
          <Outlet />
          <TanStackRouterDevtools initialIsOpen={false} />
        </SidebarProvider>
      </SearchProvider>
    </ThemeProvider>
  );
}
export const Route = createRootRoute({
  component: RootComponent,
  notFoundComponent: () => <NotFound />,
  // Add global head management
  head: () => ({
    title: "Tidy-TS Documentation",
    meta: [
      {
        name: "viewport",
        content: "width=device-width, initial-scale=1",
      },
      {
        name: "theme-color",
        content: "#ffffff",
      },
      {
        name: "description",
        content:
          "TypeScript data manipulation and statistics library documentation",
      },
    ],
    links: [
      {
        rel: "icon",
        href: "/favicon.ico",
      },
    ],
  }),
});
