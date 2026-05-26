import { defineConfig, type Plugin } from "vite";

// IdleSectLife — vanilla TS, no framework plugins needed.
// A unique version per build lets the running app detect that a newer deploy is live.
const buildVersion = String(Date.now());

function emitVersionJson(): Plugin {
  return {
    name: "emit-version-json",
    generateBundle() {
      this.emitFile({
        type: "asset",
        fileName: "version.json",
        source: JSON.stringify({ version: buildVersion }),
      });
    },
  };
}

export default defineConfig({
  base: "./",
  define: {
    __APP_VERSION__: JSON.stringify(buildVersion),
  },
  plugins: [emitVersionJson()],
  server: {
    open: true,
  },
  build: {
    target: "es2020",
    outDir: "dist",
  },
});
