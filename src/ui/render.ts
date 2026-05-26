// Top-level renderer: rebuilds the game screen from state on every store notification.

import { el } from "./components/el";
import type { GameState } from "../state/gameState";
import type { GameActions } from "./gameActions";
import { timeControls } from "./controls/timeControls";
import { sectOverviewPanel } from "./panels/sectOverviewPanel";
import { resourcesPanel } from "./panels/resourcesPanel";
import { disciplesPanel } from "./panels/disciplesPanel";
import { buildingsPanel } from "./panels/buildingsPanel";
import { marketPanel } from "./panels/marketPanel";
import { eventLogPanel } from "./panels/eventLogPanel";

export function renderGame(root: HTMLElement, state: GameState, actions: GameActions): void {
  const topbar = el("header", { class: "topbar" }, [
    el("span", { class: "brand", text: "IdleSectLife" }),
    timeControls(state, actions),
  ]);

  const layout = el("div", { class: "layout" }, [
    el("div", { class: "col col-left" }, [
      sectOverviewPanel(state),
      resourcesPanel(state, actions),
      buildingsPanel(state, actions),
      marketPanel(state, actions),
    ]),
    el("div", { class: "col col-mid" }, [disciplesPanel(state, actions)]),
    el("div", { class: "col col-right" }, [eventLogPanel(state)]),
  ]);

  const footer = el("footer", { class: "footer" }, [
    el("button", {
      class: "reset-btn",
      text: "Abandon & Start Over",
      title: "Delete this save and choose a new sect",
      onClick: () => actions.hardReset(),
    }),
  ]);

  // Preserve scroll position: rebuilding the DOM can otherwise jump the page (e.g. clicking
  // a market button briefly collapses the layout height and the browser clamps the scroll).
  const sx = window.scrollX;
  const sy = window.scrollY;
  root.replaceChildren(topbar, layout, footer);
  window.scrollTo(sx, sy);
}
