// Resource stockpiles with caps, a per-day net rate, and a manual +1 gather button.

import { el, panel } from "../components/el";
import { fmt, fmtCap } from "../components/format";
import type { GameState } from "../../state/gameState";
import type { GameActions } from "../gameActions";
import {
  RESOURCE_ICON,
  RESOURCE_LABEL,
  isCollectable,
  type ResourceType,
} from "../../domain/resources/resourceTypes";
import { capFor } from "../../domain/resources/resources";
import { dailyNet } from "../../domain/simulation/projection";

const ROW_ORDER: ResourceType[] = ["stone", "wood", "food", "cloth", "gold"];

function rateSpan(type: ResourceType, rate: number): HTMLElement {
  // Gold and cloth have no daily flow in v1.
  if (!isCollectable(type)) {
    return el("span", { class: "res-rate flat", text: "—" });
  }
  const rounded = Math.round(rate);
  const cls = rounded > 0 ? "up" : rounded < 0 ? "down" : "flat";
  const sign = rounded < 0 ? "−" : "+";
  return el("span", {
    class: `res-rate ${cls}`,
    title: "Net change per day (collection − consumption)",
    text: `${sign}${Math.abs(rounded)}/day`,
  });
}

function resourceRow(
  state: GameState,
  actions: GameActions,
  type: ResourceType,
  rate: number,
): HTMLElement {
  const amount = state.resources[type];
  const cap = capFor(state, type);
  const atCap = cap !== Infinity && amount >= cap;

  const children: HTMLElement[] = [
    el("span", { class: "res-icon", text: RESOURCE_ICON[type] }),
    el("span", { class: "res-name", text: RESOURCE_LABEL[type] }),
    el("span", {
      class: `res-amount ${atCap ? "at-cap" : ""}`.trim(),
      text: `${fmt(amount)} / ${fmtCap(cap)}`,
    }),
    rateSpan(type, rate),
  ];

  if (isCollectable(type)) {
    children.push(
      el("button", {
        class: "res-gather",
        text: "+1",
        title: `Gather 1 ${RESOURCE_LABEL[type]} by hand`,
        disabled: atCap,
        onClick: () => actions.manualCollect(type),
      }),
    );
  }

  return el("div", { class: "res-row" }, children);
}

export function resourcesPanel(state: GameState, actions: GameActions): HTMLElement {
  const rates = dailyNet(state);
  return panel(
    "Resources",
    ROW_ORDER.map((type) => resourceRow(state, actions, type, rates[type])),
    "resources",
  );
}
