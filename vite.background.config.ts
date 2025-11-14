import { defineConfig } from "vite";
import { resolve } from "path";
import { fileURLToPath } from "url";

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        background: resolve(__dirname, "src/background/main.ts"),
      },
      output: {
        entryFileNames: "background.js",
      },
    },
    outDir: "dist",
    minify: false,
    sourcemap: true,
    emptyOutDir: false,
  },
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url))
    }
  }
});
