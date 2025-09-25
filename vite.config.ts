import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const CLIENT = resolve(__dirname, "client");

export default defineConfig({
  root: CLIENT,
  plugins: [react()],
  resolve: {
    alias: {
      "@": resolve(CLIENT, "src"),
      "@shared": resolve(__dirname, "shared"),
      "@assets": resolve(__dirname, "attached_assets"),
    },
  },
  build: {
    outDir: resolve(__dirname, "dist/public"),
    emptyOutDir: true,
  },
  server: {
    host: "0.0.0.0",
    port: 3000, // use 3000 (or omit to use Vite default 5173)
    fs: { strict: true, deny: ["**/.*"] },
  },
  preview: {
    host: "0.0.0.0",
    port: 3000,
  },
});
