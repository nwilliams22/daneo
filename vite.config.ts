/// <reference types="vitest/config" />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  // Tauri expects a fixed dev-server port
  server: {
    port: 5173,
    strictPort: true,
    // Browser dev calls the translator proxy same-origin; the Tauri build
    // talks to http://127.0.0.1:8787 directly (CORS is open on the proxy).
    proxy: {
      "/api": "http://127.0.0.1:8787",
    },
  },
  test: {
    environment: "node",
  },
});
