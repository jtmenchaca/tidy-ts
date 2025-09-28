/// <reference lib="dom" />
import { StrictMode } from "react";
import ReactDOM from "react-dom/client";
import { createRouter, RouterProvider } from "@tanstack/react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// Import the generated route tree
import { routeTree } from "./routeTree.gen.ts";

// Create a new query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 30 * 60 * 1000, // 30 minutes
      retry: false, // Disable retries
    },
  },
});

// Create a new router instance with query client context
const router = createRouter({
  routeTree,
  basepath: "/tidy-ts",
  context: {
    queryClient,
  },
});

// Register the router instance for type safety
declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

// Render the app
const rootElement = document.getElementById("root")!;
const root = ReactDOM.createRoot(rootElement);
root.render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  </StrictMode>,
);

// Handle redirects from 404.html for GitHub Pages
const urlParams = new URLSearchParams(window.location.search);
const currentRoute = urlParams.get("currentRoute");
if (currentRoute) {
  // Clean up the URL and navigate to the intended route
  window.history.replaceState(null, "", window.location.pathname);
  router.navigate({ to: `/${currentRoute}` });
}
