// Headless DOM render test: mount the UI into jsdom and assert it builds without throwing.

import { JSDOM } from "jsdom";

const dom = new JSDOM("<!doctype html><html><body><div id='app'></div></body></html>");
const g = globalThis as unknown as { document: Document; window: unknown };
g.document = dom.window.document;
g.window = dom.window;

// Import after globals are set (modules call `document` at runtime, not import time).
const { Rng } = await import("../src/core/rng/rng");
const { createNewGame } = await import("../src/state/gameState");
const { advanceDay } = await import("../src/domain/simulation/advanceDay");
const { renderGame } = await import("../src/ui/render");
const { renderNewGameScreen } = await import("../src/ui/newGameScreen");
import type { GameActions } from "../src/ui/gameActions";

let failures = 0;
function check(cond: boolean, msg: string): void {
  if (!cond) {
    failures++;
    console.error("  ✗ FAIL:", msg);
  } else {
    console.log("  ✓", msg);
  }
}

const root = dom.window.document.getElementById("app") as HTMLElement;
const noop = () => {};
const actions: GameActions = {
  newGame: noop,
  hardReset: noop,
  setSpeed: noop,
  togglePause: noop,
  upgradePavilion: noop,
  upgradeSect: noop,
  setDiscipleAction: noop,
  manualCollect: noop,
  sell: noop,
  buy: noop,
};

// 1. New game screen.
renderNewGameScreen(root, actions);
check(root.querySelectorAll(".sect-card").length === 4, "new-game screen shows 4 sect cards");

// 2. Game screen after a few simulated days.
const rng = new Rng(999);
const state = createNewGame("bow", rng);
for (let i = 0; i < 45; i++) advanceDay(state, rng);

renderGame(root, state, actions);
check(root.querySelectorAll(".panel").length >= 6, "game screen renders >= 6 panels");
check(root.querySelector(".topbar") !== null, "topbar present");
check(root.querySelectorAll(".disciple-card").length === state.disciples.length, "one card per disciple");
check(root.querySelectorAll(".attr-row").length === 4 * state.disciples.length, "4 attribute rows per disciple");
check(root.querySelectorAll(".attr-stars").length > 0, "star meters rendered");
check(root.querySelectorAll(".action-select").length === 3 * state.disciples.filter((d) => d.status === "active").length, "3 action selects per active disciple");
check(root.querySelector(".speed-btn.active") !== null || state.settings.paused, "a speed button is active");
const hpBar = root.querySelector(".bar-fill.hp") as HTMLElement | null;
check(hpBar !== null && hpBar.style.width.endsWith("%"), "HP bar width was set");

console.log(failures === 0 ? "\n✓ UI RENDER OK" : `\n✗ ${failures} CHECK(S) FAILED`);
process.exit(failures === 0 ? 0 : 1);
