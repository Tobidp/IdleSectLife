// Faction runtime: per-faction relation score, curry-favor action that swaps resources
// for relation, and a small yield-modifier helper that the territory monthly tick will
// consult to scale rewards by faction goodwill.

import type { GameState } from "../../state/gameState";
import {
  ALL_FACTION_IDS,
  FACTIONS,
  FAVOR_RELATION_BUMP,
  type FactionId,
} from "../../data/factions/factionDefs";
import type { TerritoryId } from "../../data/territories/territoryDefs";
import { pushLog } from "../../state/log";

export function createInitialFactionRelations(): Record<string, number> {
  const out: Record<string, number> = {};
  for (const id of ALL_FACTION_IDS) out[id] = 0;
  return out;
}

export function reconcileFactionRelations(
  existing: Record<string, number> | undefined,
): Record<string, number> {
  const base = createInitialFactionRelations();
  for (const id of ALL_FACTION_IDS) {
    const v = existing?.[id];
    if (typeof v === "number" && Number.isFinite(v)) {
      base[id] = Math.max(-100, Math.min(100, v));
    }
  }
  return base;
}

/** Spend a faction's favorCost to bump relation by FAVOR_RELATION_BUMP. */
export function curryFactionFavor(state: GameState, factionId: FactionId): boolean {
  const def = FACTIONS[factionId];
  if (!def) return false;
  // Check + spend resources atomically.
  for (const [k, v] of Object.entries(def.favorCost) as [keyof typeof def.favorCost, number][]) {
    if ((state.resources[k] ?? 0) < (v ?? 0)) return false;
  }
  for (const [k, v] of Object.entries(def.favorCost) as [keyof typeof def.favorCost, number][]) {
    state.resources[k] = Math.max(0, (state.resources[k] ?? 0) - (v ?? 0));
  }
  state.factionRelations[factionId] = Math.min(
    100,
    (state.factionRelations[factionId] ?? 0) + FAVOR_RELATION_BUMP,
  );
  pushLog(
    state,
    `Curried favor with ${def.name} (+${FAVOR_RELATION_BUMP} relation).`,
    "info",
  );
  return true;
}

/** Find the faction (if any) tied to a given territory. */
export function factionForTerritory(territoryId: TerritoryId): FactionId | null {
  for (const id of ALL_FACTION_IDS) {
    if (FACTIONS[id].territoryId === territoryId) return id;
  }
  return null;
}

/** Yield multiplier the territory should apply when the player controls it. Mapping:
 *  +100 relation → 1.5x · 0 → 1.0x · -100 → 0.5x. */
export function territoryYieldMult(state: GameState, territoryId: TerritoryId): number {
  const factionId = factionForTerritory(territoryId);
  if (!factionId) return 1;
  const relation = state.factionRelations[factionId] ?? 0;
  return 1 + relation / 200;
}
