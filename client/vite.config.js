import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
    // Drop console/debugger in all transforms (dev + prod), not just minification
    esbuild: {
      drop: ["console", "debugger"],
    },
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: "http://localhost:5000",
        changeOrigin: true,
        secure: false,
      },
    },
  },
  build: {
    outDir: "dist",
    sourcemap: false, // no source maps in production — reduces bundle size and conceals source
    minify: "esbuild", // esbuild is the default and fastest; switch to 'terser' for ~5% smaller at cost of slower builds
      target: "es2020", // all modern mobile browsers (Chrome 85+, Safari 14+) support ES2020
    rollupOptions: {
      output: {
        // Split vendor chunks so app code changes don't bust the vendor cache
        manualChunks(id) {
          if (id.includes("node_modules")) {
            // Keep react ecosystem together
            if (
              id.includes("react") ||
              id.includes("react-dom") ||
              id.includes("react-router")
            ) {
              return "react-vendor";
            }
            // Keep tanstack query together
            if (id.includes("@tanstack")) {
              return "tanstack-vendor";
            }
            // Everything else in a general vendor chunk
            return "vendor";
          }
        },
      },
    },
    // esbuild transform options — drops all console.* and debugger statements
  },
  publicDir: "public", // Ensures robots.txt and sitemap.xml are copied to dist
});
