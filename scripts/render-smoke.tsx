// Headless React render test: server-render the key UI subtrees and assert they build with
// the expected structure. Uses renderToStaticMarkup (no DOM/effects needed).

import { renderToStaticMarkup } from "react-dom/server";

// Minimal globals the engine touches (loop rAF + save localStorage).
const g = globalThis as unknown as Record<string, unknown>;
g.requestAnimationFrame = () => 0;
g.cancelAnimationFrame = () => {};
const ls = new Map<string, string>();
g.localStorage = {
  getItem: (k: string) => (ls.has(k) ? ls.get(k)! : null),
  setItem: (k: string, v: string) => void ls.set(k, String(v)),
  removeItem: (k: string) => void ls.delete(k),
};

const { GameEngine } = await import("../src/core/engine");
const { EngineProvider } = await import("../src/ui/engineContext");
const { ViewProvider } = await import("../src/ui/viewContext");
const { NewGameScreen } = await import("../src/ui/NewGameScreen");
const { Topbar } = await import("../src/ui/Topbar");
const { SectDashboard } = await import("../src/ui/tabs/SectDashboard");
const { DisciplesView } = await import("../src/ui/tabs/DisciplesView");

let failures = 0;
function check(cond: boolean, msg: string): void {
  if (!cond) {
    failures++;
    console.error("  ✗ FAIL:", msg);
  } else {
    console.log("  ✓", msg);
  }
}
const count = (html: string, re: RegExp): number => (html.match(re) ?? []).length;

const engine = new GameEngine();

// 1. New-game screen.
const ngHtml = renderToStaticMarkup(
  <EngineProvider engine={engine}>
    <NewGameScreen />
  </EngineProvider>,
);
check(count(ngHtml, /sect-card"/g) === 4, "new-game screen shows 4 sect cards");

// Start a game (loop is stubbed via rAF).
engine.newGame("bow");
const state = engine.getState()!;
check(state !== null && state.disciples.length >= 1, "newGame produced state with disciples");

// 2. Topbar: brand + 3 tabs.
const topHtml = renderToStaticMarkup(
  <EngineProvider engine={engine}>
    <ViewProvider>
      <Topbar state={state} />
    </ViewProvider>
  </EngineProvider>,
);
check(topHtml.includes("Sect: Ascendant"), "topbar shows the brand");
check(count(topHtml, /tab-btn/g) === 3, "three tabs render (Sect, Disciples, Story)");
check(topHtml.includes("disabled"), "the Story tab is disabled while the feature is off");

// 3. Sect dashboard: React Grid Layout renders all five panels.
const dashHtml = renderToStaticMarkup(
  <EngineProvider engine={engine}>
    <ViewProvider>
      <SectDashboard state={state} />
    </ViewProvider>
  </EngineProvider>,
);
check(count(dashHtml, /panel-title/g) >= 5, "dashboard renders >=5 panels in the grid");
check(dashHtml.includes("Sect Overview"), "overview panel present");
check(dashHtml.includes("react-grid-layout"), "React Grid Layout container rendered");
check(dashHtml.includes("Reset layout"), "reset-layout control present");

// 4. Disciples view: one row per disciple + toolbar.
const discHtml = renderToStaticMarkup(
  <EngineProvider engine={engine}>
    <ViewProvider>
      <DisciplesView state={state} />
    </ViewProvider>
  </EngineProvider>,
);
check(count(discHtml, /d-row/g) === state.disciples.length, "one row per disciple");
check(discHtml.includes("disciples-toolbar"), "management toolbar present");
check(count(discHtml, /action-select/g) >= 3, "action selects render for active disciples");

console.log(failures === 0 ? "\n✓ UI RENDER OK" : `\n✗ ${failures} CHECK(S) FAILED`);
process.exit(failures === 0 ? 0 : 1);
