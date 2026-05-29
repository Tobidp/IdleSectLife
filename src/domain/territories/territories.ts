// Territory runtime. Each region carries a player-influence value (0..100) competed
// against an aggregate rival-influence value (0..100). Daily ticks creep rival influence
// upward based on the aggregate rival pressure in the region; monthly ticks pay out the
// def's yield to the controlling side (player gets resources + fame; rivals get a log
// line but no resource accounting yet).

import type { GameState } from "../../state/gameState";
import { ALL_TERRITORY_IDS, TERRITORIES, type TerritoryId } from "../../data/territories/territoryDefs";
import { pushLog } from "../../state/log";
import { territoryYieldMult } from "../factions/factions";

export interface TerritoryState {
  id: TerritoryId;
  playerInfluence: number;
  rivalInfluence: number;
}

const INFLUENCE_CAP = 100;
const RIVAL_DAILY_CREEP = 0.05;
const INVEST_COST_GOLD = 12;
const INVEST_BUMP = 8;

export function createInitialTerritories(): TerritoryState[] {
  return ALL_TERRITORY_IDS.map((id) => ({
    id,
    playerInfluence: TERRITORIES[id].initialPlayerInfluence,
    rivalInfluence: TERRITORIES[id].initialRivalInfluence,
  }));
}

export function reconcileTerritories(existing: TerritoryState[] | undefined): TerritoryState[] {
  const byId = new Map((existing ?? []).map((t) => [t.id, t]));
  return ALL_TERRITORY_IDS.map((id) => {
    const def = TERRITORIES[id];
    const cur = byId.get(id);
    if (cur) {
      return {
        id,
        playerInfluence: Math.max(0, Math.min(INFLUENCE_CAP, cur.playerInfluence)),
        rivalInfluence: Math.max(0, Math.min(INFLUENCE_CAP, cur.rivalInfluence)),
      };
    }
    return {
      id,
      playerInfluence: def.initialPlayerInfluence,
      rivalInfluence: def.initialRivalInfluence,
    };
  });
}

/** Daily tick: rivals push back; monthly tick: pay out yields to the controlling side. */
export function advanceTerritories(state: GameState, monthChanged: boolean): void {
  // Aggregate rival pressure scales with their global influence — more powerful rivals
  // creep harder into every region.
  const totalRivalInfluence = state.rivals.reduce((sum, r) => sum + r.influence, 0);
  const pressureMult = 0.5 + totalRivalInfluence / 200; // 0.5..1.0
  for (const t of state.territories) {
    t.rivalInfluence = Math.min(
      INFLUENCE_CAP,
      t.rivalInfluence + RIVAL_DAILY_CREEP * pressureMult,
    );
    // Player influence decays very slightly when un-invested in.
    t.playerInfluence = Math.max(0, t.playerInfluence - RIVAL_DAILY_CREEP * 0.3);
  }
  if (monthChanged) {
    for (const t of state.territories) {
      const def = TERRITORIES[t.id];
      if (!def) continue;
      const playerControls = t.playerInfluence > t.rivalInfluence;
      if (!playerControls) continue;
      // Faction relation scales the yield: +100 → 1.5x, 0 → 1x, -100 → 0.5x.
      const mult = territoryYieldMult(state, t.id);
      let summary: string[] = [];
      for (const [k, v] of Object.entries(def.yield) as [keyof typeof def.yield, number][]) {
        if (typeof v !== "number") continue;
        const gain = Math.max(0, Math.round(v * mult));
        state.resources[k] = (state.resources[k] ?? 0) + gain;
        summary.push(`+${gain} ${k}`);
      }
      if (def.fameYield > 0) {
        const fameGain = Math.max(0, Math.round(def.fameYield * mult));
        state.fame += fameGain;
        summary.push(`+${fameGain} fame`);
      }
      pushLog(
        state,
        `${def.name} pays tribute to your sect this month (${summary.join(", ")}).`,
        "good",
      );
    }
  }
}

/** Spend gold to push player influence in a region. Returns false if no gold. */
export function investInTerritory(state: GameState, territoryId: TerritoryId): boolean {
  const t = state.territories.find((x) => x.id === territoryId);
  if (!t) return false;
  if (state.resources.gold < INVEST_COST_GOLD) return false;
  state.resources.gold -= INVEST_COST_GOLD;
  t.playerInfluence = Math.min(INFLUENCE_CAP, t.playerInfluence + INVEST_BUMP);
  pushLog(
    state,
    `Invested ${INVEST_COST_GOLD} gold in ${TERRITORIES[territoryId].name} (+${INVEST_BUMP} influence).`,
    "info",
  );
  return true;
}

export const TERRITORY_INVEST_COST = INVEST_COST_GOLD;
export const TERRITORY_INVEST_BUMP = INVEST_BUMP;
