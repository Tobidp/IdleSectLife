// Top-level renderer: tab bar + either the Sect dashboard or the Disciples view.

import { el } from "./components/el";
import type { GameState } from "../state/gameState";
import type { GameActions } from "./gameActions";
import type { ViewState, Tab } from "./viewState";
import { timeControls } from "./controls/timeControls";
import { sectOverviewPanel } from "./panels/sectOverviewPanel";
import { resourcesPanel } from "./panels/resourcesPanel";
import { buildingsPanel } from "./panels/buildingsPanel";
import { marketPanel } from "./panels/marketPanel";
import { eventLogPanel } from "./panels/eventLogPanel";
import { disciplesView } from "./views/disciplesView";
import { storyView } from "./views/storyView";
import { STORY_ENABLED } from "../config/featureFlags";

function tabButton(
  view: ViewState,
  actions: GameActions,
  tab: Tab,
  label: string,
  alert = false,
  disabled = false,
): HTMLElement {
  return el("button", {
    class: `tab-btn ${view.tab === tab ? "active" : ""}`.trim(),
    disabled,
    title: disabled ? "Coming soon" : "",
    onClick: () => {
      if (!disabled) actions.setTab(tab);
    },
  }, [
    el("span", { text: label }),
    alert ? el("span", { class: "tab-alert", title: "Something needs your attention" }) : null,
  ]);
}

function sectDashboard(state: GameState, actions: GameActions): HTMLElement {
  return el("div", { class: "layout" }, [
    el("div", { class: "col col-left" }, [
      sectOverviewPanel(state),
      resourcesPanel(state, actions),
      buildingsPanel(state, actions),
      marketPanel(state, actions),
    ]),
    el("div", { class: "col col-right" }, [eventLogPanel(state)]),
  ]);
}

export function renderGame(
  root: HTMLElement,
  state: GameState,
  view: ViewState,
  actions: GameActions,
): void {
  const topbar = el("header", { class: "topbar" }, [
    el("span", { class: "brand", text: "IdleSectLife" }),
    el("nav", { class: "tabs" }, [
      tabButton(view, actions, "sect", "Sect"),
      tabButton(view, actions, "disciples", `Disciples (${state.disciples.length})`),
      tabButton(
        view,
        actions,
        "story",
        "Story",
        state.narrative.pendingEncounters.length > 0,
        !STORY_ENABLED,
      ),
    ]),
    timeControls(state, actions),
  ]);

  const body =
    view.tab === "disciples"
      ? el("div", { class: "view-disciples" }, [disciplesView(state, view, actions)])
      : view.tab === "story"
        ? storyView(state, view, actions)
        : sectDashboard(state, actions);

  const footer = el("footer", { class: "footer" }, [
    el("button", {
      class: "reset-btn",
      text: "Abandon & Start Over",
      title: "Delete this save and choose a new sect",
      onClick: () => actions.hardReset(),
    }),
  ]);

  // Preserve scroll position across the DOM rebuild (e.g. clicking a market button
  // would otherwise jump the page when the layout height changes).
  const sx = window.scrollX;
  const sy = window.scrollY;
  root.replaceChildren(topbar, body, footer);
  window.scrollTo(sx, sy);
}
