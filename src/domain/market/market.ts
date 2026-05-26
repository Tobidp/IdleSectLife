// Buy/sell resources for gold. The only gold source in v1.

import { MARKET_PRICES } from "../../data/prices";
import { addResource, capFor } from "../resources/resources";
import { pushLog } from "../../state/log";
import { RESOURCE_LABEL, type ResourceType } from "../resources/resourceTypes";
import type { GameState } from "../../state/gameState";

export function sellResource(state: GameState, resource: ResourceType, qty: number): boolean {
  const price = MARKET_PRICES[resource].sell;
  if (price === null || qty <= 0) return false;
  if (state.resources[resource] < qty) return false;

  state.resources[resource] -= qty;
  state.resources.gold += price * qty;
  pushLog(state, `Sold ${qty} ${RESOURCE_LABEL[resource]} for ${price * qty} gold.`, "info");
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
