import { defineConfig } from "vite";

// IdleSectLife — vanilla TS, no framework plugins needed.
export default defineConfig({
  base: "./",
  server: {
    open: true,
  },
  build: {
    target: "es2020",
    outDir: "dist",
  },
});
