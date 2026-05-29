// Sect: Ascendant — entry point. Boots the engine, mounts the React UI, and watches for new deploys.

import { createRoot } from "react-dom/client";
import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";
import { GameEngine } from "./core/engine";
import { App } from "./ui/App";
import { EngineProvider } from "./ui/engineContext";
import { ViewProvider } from "./ui/viewContext";
import { PrefsProvider } from "./ui/prefsContext";
import { ErrorBoundary } from "./ui/ErrorBoundary";

const engine = new GameEngine();
engine.boot();

const container = document.getElementById("app");
if (!container) {
  throw new Error("Sect: Ascendant: #app container not found");
}

createRoot(container).render(
  <ErrorBoundary>
    <EngineProvider engine={engine}>
      <ViewProvider>
        <PrefsProvider>
          <App />
        </PrefsProvider>
      </ViewProvider>
    </EngineProvider>
  </ErrorBoundary>,
);
