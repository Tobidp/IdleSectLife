// Auto-sell: once the Merchant Pavilion is built, surplus is sold for gold whenever a
// resource hits its storage cap. The player sets a percentage of the cap to off-load per
// resource; the merchant's level fetches a better price.

import { MARKET_PRICES } from "../../data/prices";
import { capFor } from "../resources/resources";
import { merchantBuilt, merchantSellMultiplier } from "../buildings/buildings";
import { pushLog } from "../../state/log";
import { RESOURCE_LABEL, type ResourceType } from "../resources/resourceTypes";
import type { GameState } from "../../state/gameState";

/** Resources the market will buy (have a sell price). */
export const AUTOSELLABLE: ResourceType[] = (Object.keys(MARKET_PRICES) as ResourceType[]).filter(
  (r) => MARKET_PRICES[r].sell !== null,
);

/** Sell the configured share of any capped resource that is currently full. */
export function applyAutoSell(state: GameState): void {
  if (!merchantBuilt(state)) return;
  const mult = merchantSellMultiplier(state.buildings.merchant.level);

  for (const res of AUTOSELLABLE) {
    const pct = state.autoSell[res] ?? 0;
    if (pct <= 0) continue;
    const cap = capFor(state, res);
    if (cap === Infinity || state.resources[res] < cap) continue; // only when full

    const want = Math.floor((cap * pct) / 100);
    const qty = Math.min(want, Math.floor(state.resources[res]));
    if (qty <= 0) continue;

    const gold = Math.floor(qty * (MARKET_PRICES[res].sell ?? 0) * mult);
    state.resources[res] -= qty;
    state.resources.gold += gold;
    pushLog(state, `Merchant auto-sold ${qty} ${RESOURCE_LABEL[res]} for ${gold} gold.`, "info");
  }
}
