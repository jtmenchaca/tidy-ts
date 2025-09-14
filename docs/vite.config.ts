import { defineConfig } from "vite";
import * as path from "node:path";
import react from "@vitejs/plugin-react";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import tailwindcss from "@tailwindcss/vite";

// https://vitejs.dev/config/
export default defineConfig({
  base: "/tidy-ts/",
  plugins: [
    // Please make sure that '@tanstack/router-plugin' is passed before '@vitejs/plugin-react'
    tanstackRouter({
      target: "react",
      autoCodeSplitting: true,
      addExtensions: true,
      generatedRouteTree: "./src/routeTree.gen.ts",
      routesDirectory: "./src/routes",
      quoteStyle: "double",
      routeFileIgnorePattern: ".(test.ts|examples.ts|md|example.ts)"
    }),
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: "http://127.0.0.1:8000",
        changeOrigin: true,
      },
      "/launch": {
        target: "http://127.0.0.1:8000",
        changeOrigin: true,
      },
      "/callback": {
        target: "http://127.0.0.1:8000",
        changeOrigin: true,
      },
      "/.well-known/jwks.json": {
        target: "http://127.0.0.1:8000",
        changeOrigin: true,
      },
    },
    host: true,
  },
  build: {
    outDir: "./dist/",
    emptyOutDir: true,
    rollupOptions: {
      output: {
        manualChunks: {
          // Separate Shiki into its own chunk
          'shiki': ['shiki'],
          'shiki-themes': ['@shikijs/transformers'],
          // Separate large UI libraries
          'recharts': ['recharts'],
          // Separate Radix UI components
          'radix': [
            '@radix-ui/react-accordion',
            '@radix-ui/react-alert-dialog',
            '@radix-ui/react-aspect-ratio',
            '@radix-ui/react-avatar',
            '@radix-ui/react-checkbox',
            '@radix-ui/react-collapsible',
            '@radix-ui/react-context-menu',
            '@radix-ui/react-dialog',
            '@radix-ui/react-dropdown-menu',
            '@radix-ui/react-hover-card',
            '@radix-ui/react-label',
            '@radix-ui/react-menubar',
            '@radix-ui/react-navigation-menu',
            '@radix-ui/react-popover',
            '@radix-ui/react-progress',
            '@radix-ui/react-radio-group',
            '@radix-ui/react-scroll-area',
            '@radix-ui/react-select',
            '@radix-ui/react-separator',
            '@radix-ui/react-slider',
            '@radix-ui/react-slot',
            '@radix-ui/react-switch',
            '@radix-ui/react-tabs',
            '@radix-ui/react-toggle',
            '@radix-ui/react-toggle-group',
            '@radix-ui/react-tooltip'
          ]
        }
      }
    }
  },
});
