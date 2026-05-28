// Projected per-day resource flow, for the Resources panel. Mirrors advanceDay's daily logic
// (collection by active disciples, season modifier, food consumption) without mutating state.

import type { GameState } from "../../state/gameState";
import type { ResourceType } from "../resources/resourceTypes";
import { collectYield, foodNeed } from "../resources/resources";
import { collectResourceOf } from "../disciples/actions";
import { effectiveLevel } from "../disciples/attributes";
import { currentSeason } from "../../core/time/timeEngine";
import { seasonMultiplier } from "../../data/seasons";
import { monthlyMaintenance } from "../buildings/maintenance";
import { achievementMultipliers } from "../achievements/achievements";
import { herbProductionPerDay } from "../buildings/buildings";
import { PASSIVE_GOLD_PER_MONTH } from "../../data/balance";

/** Net resource change expected per day from disciple activity (gross collection minus food eaten). */
export function dailyNet(state: GameState): Record<ResourceType, number> {
  const season = currentSeason(state.time);
  const bonus = achievementMultipliers(state).collect;
  const net: Record<ResourceType, number> = {
    stone: 0,
    wood: 0,
    food: 0,
    gold: 0,
    cloth: 0,
    herb: 0,
  };

  for (const d of state.disciples) {
    if (d.status !== "active") continue;
    const strengthLevel = effectiveLevel(d.attributes.strength);
    for (const action of d.actions) {
      const resource = collectResourceOf(action);
      if (resource) {
        net[resource] += collectYield(resource, strengthLevel, seasonMultiplier(season, resource)) * bonus;
      }
    }
  }

  net.food -= foodNeed(state);
  net.herb += herbProductionPerDay(state);
  return net;
}

/** Predictable monthly gold change: tiny passive income minus the gold upkeep ("wages").
 *  Auto-sell income is excluded (it only fires when a store is full). */
export function monthlyGoldNet(state: GameState): number {
  return PASSIVE_GOLD_PER_MONTH - (monthlyMaintenance(state).gold ?? 0);
}
