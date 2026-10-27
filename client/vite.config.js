import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    dedupe: [
      "react",
      "react-dom",
      "react-router-dom",
      "sileo",
      "@tanstack/react-query",
    ],
  },
  optimizeDeps: {
    include: [
      "react",
      "react-dom",
      "react-dom/client",
      "react/jsx-runtime",
      "react/jsx-dev-runtime",
      "react-router-dom",
      "sileo",
      "@tanstack/react-query",
    ],
  },
  // Drop console/debugger in all transforms (dev + prod), not just minification
  esbuild: {
    drop: ["console", "debugger"],
  },
  server: {
    host: "0.0.0.0",
    port: 5173,
    proxy: {
      "/api": {
        target: "http://localhost:5000",
        changeOrigin: true,
        secure: false,
      },
      "/socket.io": {
        target: "http://localhost:5000",
        changeOrigin: true,
        ws: true,
        secure: false,
      },
    },
  },
  build: {
    outDir: "dist",
    sourcemap: false, // no source maps in production — reduces bundle size and conceals source
    minify: "esbuild", // esbuild is the default and fastest; switch to 'terser' for ~5% smaller at cost of slower builds
    target: "es2020", // all modern mobile browsers (Chrome 85+, Safari 14+) support ES2020
  },
  publicDir: "public", // Ensures robots.txt and sitemap.xml are copied to dist
});
