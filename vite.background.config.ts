import { defineConfig } from "vite";
import { resolve } from "path";

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
  },
});
