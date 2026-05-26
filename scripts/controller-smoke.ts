// Verifies the controller defers re-rendering while an action <select> is focused
// (so a day-tick can't close an open dropdown), then catches up once focus leaves.

import { JSDOM } from "jsdom";

const dom = new JSDOM("<!doctype html><html><body><div id='app'></div></body></html>", {
  pretendToBeVisual: true,
  url: "https://localhost/", // non-opaque origin so localStorage works
});
const g = globalThis as unknown as Record<string, unknown>;
g.document = dom.window.document;
g.window = dom.window;
g.HTMLSelectElement = dom.window.HTMLSelectElement;
// Note: leave global `performance` as Node's native one (reassigning jsdom's recurses).
g.localStorage = dom.window.localStorage;
g.confirm = () => true;
// Stub rAF so the game loop doesn't actually tick during the test.
g.requestAnimationFrame = () => 0;
g.cancelAnimationFrame = () => {};

const { GameController } = await import("../src/core/controller");

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
const ctrl = new GameController(root);
ctrl.newGame("sword");

const sel1 = root.querySelector(".action-select") as HTMLSelectElement | null;
check(sel1 !== null, "action <select> rendered after newGame");

sel1!.focus();
check(dom.window.document.activeElement === sel1, "select is focused (dropdown 'open')");

// A store change while focused (simulates a day-tick redraw) must NOT rebuild the panel.
ctrl.manualCollect("stone");
check(root.querySelector(".action-select") === sel1, "select NOT rebuilt while focused");
check(root.contains(sel1!), "focused select still in the DOM");

// Losing focus should trigger the deferred catch-up render.
sel1!.blur();
await new Promise((r) => setTimeout(r, 25));
check(!root.contains(sel1!), "after blur, the deferred render rebuilt the panel");
check(root.querySelectorAll(".action-select").length >= 1, "selects present after catch-up render");

console.log(failures === 0 ? "\n✓ CONTROLLER DEFERRAL OK" : `\n✗ ${failures} CHECK(S) FAILED`);
process.exit(failures === 0 ? 0 : 1);
