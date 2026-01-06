// vite.content.config.ts
import { resolve } from "path";
import { fileURLToPath } from "url";
import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  root: "src",
  publicDir: false,
  plugins: [react(), tailwindcss()],
  build: {
    outDir: "../dist",
    emptyOutDir: false,
    rollupOptions: {
      input: {
        content: resolve(__dirname, "src/content/toast.tsx"),
      },
      output: {
        entryFileNames: "[name].js",
        format: "iife",
      },
    },
  },
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
});
