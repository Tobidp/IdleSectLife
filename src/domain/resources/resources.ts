// Resource math: warehouse caps, collection yield, food need, spending.

import type { ResourceType } from "./resourceTypes";
import { STORABLE_RESOURCES } from "./resourceTypes";
import { WAREHOUSE, type Cost } from "../../data/costs";
import {
  COLLECT_BASE_BY_RESOURCE,
  COLLECT_PER_LEVEL,
  FOOD_PER_DISCIPLE_PER_DAY,
} from "../../data/balance";
import type { CollectableResource } from "./resourceTypes";
import type { GameState } from "../../state/gameState";

export function warehouseCap(level: number): number {
  return Math.round(
    WAREHOUSE.baseCapacity * Math.pow(WAREHOUSE.capacityMultPerLevel, Math.max(0, level - 1)),
  );
}

/** Storage cap for a resource. Gold is uncapped in v1 (Vault is a v2 building). */
export function capFor(state: GameState, resource: ResourceType): number {
  if (resource === "gold") return Infinity;
  return warehouseCap(state.buildings.warehouse.level);
}

export function clampResource(state: GameState, resource: ResourceType): void {
  const cap = capFor(state, resource);
  if (state.resources[resource] > cap) state.resources[resource] = cap;
  if (state.resources[resource] < 0) state.resources[resource] = 0;
}

export function clampAllResources(state: GameState): void {
  for (const r of STORABLE_RESOURCES) clampResource(state, r);
}

export function addResource(state: GameState, resource: ResourceType, amount: number): void {
  state.resources[resource] += amount;
  clampResource(state, resource);
}

/** Units gathered by one collect action, given the resource, the gatherer's Strength level and the season. */
export function collectYield(
  resource: CollectableResource,
  strengthLevel: number,
  seasonMult: number,
): number {
  return (COLLECT_BASE_BY_RESOURCE[resource] + strengthLevel * COLLECT_PER_LEVEL) * seasonMult;
}

export function foodNeed(state: GameState): number {
  return state.disciples.length * FOOD_PER_DISCIPLE_PER_DAY;
}

export function canAfford(state: GameState, cost: Cost): boolean {
  for (const k of Object.keys(cost) as ResourceType[]) {
    if ((state.resources[k] ?? 0) < (cost[k] ?? 0)) return false;
  }
  return true;
}

/** Deducts `cost` if affordable; returns whether it succeeded. */
export function spend(state: GameState, cost: Cost): boolean {
  if (!canAfford(state, cost)) return false;
  for (const k of Object.keys(cost) as ResourceType[]) {
    state.resources[k] -= cost[k] ?? 0;
  }
  return true;
}
