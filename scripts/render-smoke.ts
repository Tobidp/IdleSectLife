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
const { createViewState } = await import("../src/ui/viewState");
const { createDisciple } = await import("../src/domain/disciples/disciple");
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
  manualCollect: noop,
  sell: noop,
  buy: noop,
  setDiscipleAction: noop,
  acceptApplicant: noop,
  denyApplicant: noop,
  setTab: noop,
  setDiscipleSort: noop,
  toggleDiscipleSelected: noop,
  toggleDiscipleExpanded: noop,
  selectDisciplePortion: noop,
  setBulkActivity: noop,
  applyActionToSelected: noop,
  applyPresetToAll: noop,
};

// 1. New game screen.
renderNewGameScreen(root, actions);
check(root.querySelectorAll(".sect-card").length === 4, "new-game screen shows 4 sect cards");

// 2. Sect dashboard (default tab) after a few simulated days.
const rng = new Rng(999);
const state = createNewGame("bow", rng);
for (let i = 0; i < 45; i++) advanceDay(state, rng);
const view = createViewState();

renderGame(root, state, view, actions);
check(root.querySelectorAll(".tab-btn").length === 2, "two tabs rendered");
check(root.querySelector(".topbar") !== null, "topbar present");
check(root.querySelectorAll(".panel").length >= 5, "sect dashboard renders >= 5 panels");
check(root.querySelectorAll(".res-rate").length === 5, "per-day rate shown for all 5 resources");
check(root.querySelectorAll(".d-row").length === 0, "no disciple rows on the sect tab");
check(root.querySelector(".speed-btn.active") !== null || state.settings.paused, "a speed button is active");

// 3. Disciples tab.
view.tab = "disciples";
renderGame(root, state, view, actions);
check(root.querySelectorAll(".d-row").length === state.disciples.length, "one row per disciple");
const activeCount = state.disciples.filter((d) => d.status === "active").length;
check(root.querySelectorAll(".action-select").length === 3 * activeCount, "3 action selects per active disciple");
check(root.querySelector(".disciples-toolbar") !== null, "management toolbar present");
check(root.querySelectorAll(".d-check").length === state.disciples.length, "a checkbox per disciple");

// 4. Expanding a disciple shows its attribute rows.
view.expandedIds.add(state.disciples[0].id);
renderGame(root, state, view, actions);
check(root.querySelectorAll(".attr-row").length === 4, "expanding a disciple reveals 4 attribute rows");

// 5. Pending applicants appear with Accept/Deny (attributes hidden).
state.applicants.push(createDisciple(state.nextId++, "sword", state.sect.type, rng));
renderGame(root, state, view, actions);
check(root.querySelectorAll(".applicant-row").length === 1, "pending applicant row rendered");
check(
  root.querySelector(".accept-btn") !== null && root.querySelector(".deny-btn") !== null,
  "applicant shows Accept/Deny buttons",
);

console.log(failures === 0 ? "\n✓ UI RENDER OK" : `\n✗ ${failures} CHECK(S) FAILED`);
process.exit(failures === 0 ? 0 : 1);
