// Buy/sell resources for gold. The only gold source in v1.

import { MARKET_PRICES } from "../../data/prices";
import { addResource, capFor } from "../resources/resources";
import { pushLog } from "../../state/log";
import { RESOURCE_LABEL, type ResourceType } from "../resources/resourceTypes";
import type { GameState } from "../../state/gameState";
import { doctrineMult } from "../doctrines/effects";

export function sellResource(state: GameState, resource: ResourceType, qty: number): boolean {
  const price = MARKET_PRICES[resource].sell;
  if (price === null || qty <= 0) return false;
  if (state.resources[resource] < qty) return false;

  // Doctrines (Mercantile / Ascetic) scale the sell price. We scale the TOTAL (not the
  // per-unit price) so a 35% bump applied to a unit price of 1 doesn't round away to 0.
  const totalGold = Math.round(price * qty * doctrineMult(state, "marketSellPriceMult"));
  state.resources[resource] -= qty;
  state.resources.gold += totalGold;
  pushLog(state, `Sold ${qty} ${RESOURCE_LABEL[resource]} for ${totalGold} gold.`, "info");
  return true;
}

export function buyResource(state: GameState, resource: ResourceType, qty: number): boolean {
  const price = MARKET_PRICES[resource].buy;
  if (price === null || qty <= 0) return false;

  const room = capFor(state, resource) - state.resources[resource];
  if (room <= 0) return false;

  const buyQty = Math.min(qty, room);
  const cost = price * buyQty;
  if (state.resources.gold < cost) return false;

  state.resources.gold -= cost;
  addResource(state, resource, buyQty);
  pushLog(state, `Bought ${buyQty} ${RESOURCE_LABEL[resource]} for ${cost} gold.`, "info");
  return true;
}
