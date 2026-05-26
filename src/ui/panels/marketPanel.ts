// Buy/sell resources for gold.

import { el, panel } from "../components/el";
import type { GameState } from "../../state/gameState";
import type { GameActions } from "../gameActions";
import { MARKET_PRICES } from "../../data/prices";
import { RESOURCE_ICON, RESOURCE_LABEL, type ResourceType } from "../../domain/resources/resourceTypes";

const TRADE_ORDER: ResourceType[] = ["stone", "wood", "food", "cloth"];
const QTY = 10;

function marketRow(state: GameState, actions: GameActions, type: ResourceType): HTMLElement {
  const price = MARKET_PRICES[type];
  const owned = state.resources[type];

  const buttons: HTMLElement[] = [];
  if (price.sell !== null) {
    buttons.push(
      el("button", {
        class: "trade-btn sell",
        text: `Sell ${QTY} (+${price.sell * QTY}🪙)`,
        disabled: owned < QTY,
        onClick: () => actions.sell(type, QTY),
      }),
    );
  }
  if (price.buy !== null) {
    buttons.push(
      el("button", {
        class: "trade-btn buy",
        text: `Buy ${QTY} (−${price.buy * QTY}🪙)`,
        disabled: state.resources.gold < price.buy * QTY,
        onClick: () => actions.buy(type, QTY),
      }),
    );
  }

  return el("div", { class: "market-row" }, [
    el("span", { class: "res-icon", text: RESOURCE_ICON[type] }),
    el("span", { class: "res-name", text: RESOURCE_LABEL[type] }),
    el("div", { class: "trade-btns" }, buttons),
  ]);
}

export function marketPanel(state: GameState, actions: GameActions): HTMLElement {
  return panel(
    "Market",
    [
      el("p", { class: "muted market-note", text: `Gold: ${Math.round(state.resources.gold)} 🪙 · trades in batches of ${QTY}` }),
      ...TRADE_ORDER.map((type) => marketRow(state, actions, type)),
    ],
    "market",
  );
}
