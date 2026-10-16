// vite.config.ts (at repo root)
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";

export default defineConfig({
  root: "client",
  plugins: [react()],
  publicDir: path.resolve(__dirname, "public"),
  build: {
    outDir: path.resolve(__dirname, "dist"),
    assetsDir: "assets",
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, "client/index.html"),
        widget: path.resolve(__dirname, "client/src/widgets/entry.tsx"),
      },
      output: {
        entryFileNames: (chunk) =>
          chunk.name === "widget"
            ? "widgets/widget.js"
            : "assets/[name]-[hash].js",
        assetFileNames: (asset) =>
          asset.name === "widget.css"
            ? "widgets/widget.css"
            : "assets/[name]-[hash][extname]",
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "client/src"),
      "@assets": path.resolve(__dirname, "client/src/assets"),
    },
  },
});
