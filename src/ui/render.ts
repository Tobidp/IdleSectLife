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
import { windowsEnabled } from "./windows/draggableWindows";
import { COLUMN_COUNT, getLayout, orderedColumn, type WindowId } from "./windows/windowLayout";

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

/** Wrap a panel in a draggable window (a normal-flow block inside its column). */
function windowEl(id: WindowId, content: HTMLElement): HTMLElement {
  const win = el("div", { class: "window" }, [content]);
  win.dataset.windowId = id;
  return win;
}

function sectDashboard(state: GameState, actions: GameActions): HTMLElement {
  const panelById: Record<WindowId, HTMLElement> = {
    overview: sectOverviewPanel(state),
    resources: resourcesPanel(state, actions),
    buildings: buildingsPanel(state, actions),
    market: marketPanel(state, actions),
    log: eventLogPanel(state),
  };

  // Mobile/touch/narrow: keep the original tidy two-column layout (no dragging).
  if (!windowsEnabled()) {
    return el("div", { class: "layout" }, [
      el("div", { class: "col col-left" }, [
        panelById.overview,
        panelById.resources,
        panelById.buildings,
        panelById.market,
      ]),
      el("div", { class: "col col-right" }, [panelById.log]),
    ]);
  }

  const toolbar = el("div", { class: "windows-toolbar" }, [
    el("span", { class: "muted", text: "Drag a panel by its title bar; drop it into any column." }),
    el("button", {
      class: "reset-layout",
      text: "Reset layout",
      title: "Restore the default window arrangement",
      onClick: () => actions.resetWindowLayout(),
    }),
  ]);

  const layout = getLayout();
  const columns: HTMLElement[] = [];
  for (let c = 0; c < COLUMN_COUNT; c++) {
    columns.push(
      el(
        "div",
        { class: "window-col" },
        orderedColumn(layout, c).map((id) => windowEl(id, panelById[id])),
      ),
    );
  }
  const canvas = el("div", { class: "window-canvas" }, columns);
  return el("div", { class: "windows-wrap" }, [toolbar, canvas]);
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
