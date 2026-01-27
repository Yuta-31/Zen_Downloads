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
        popup: resolve(__dirname, "src/popup/index.html"),
      },
      output: {
        entryFileNames: "popup/[name].js",
        chunkFileNames: "popup/[name].js",
        assetFileNames: (assetInfo) => {
          if (assetInfo.name === "index.css") {
            return "popup/popup.css";
          }
          return "popup/[name].[ext]";
        },
      },
    },
    minify: false,
    sourcemap: true,
  },
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
});
