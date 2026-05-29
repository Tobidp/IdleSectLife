// Rival sect runtime. Each known rival lives on state.rivals; advanceRivals() ticks
// influence daily and triggers a monthly archetype-flavoured action that writes to the
// event log. Relation values (-100..100) are reserved for future systems (alliances,
// tournaments) — currently only influence and the log entry are observable.

import type { GameState } from "../../state/gameState";
import type { Rng } from "../../core/rng/rng";
import { ALL_RIVAL_IDS, RIVALS, type RivalArchetypeId, type RivalId } from "../../data/rivals/rivalDefs";
import { pushLog } from "../../state/log";

export interface RivalState {
  id: RivalId;
  /** 0..100 — caps so an unanswered rival doesn't snowball indefinitely. */
  influence: number;
  /** -100..100 — player's standing with this rival. */
  relation: number;
}

export function createInitialRivals(): RivalState[] {
  return ALL_RIVAL_IDS.map((id) => ({
    id,
    influence: RIVALS[id].initialInfluence,
    relation: 0,
  }));
}

/** Idempotent reconciliation for migrating saves — keep existing rivals at their
 *  current values, seed any new defs from initialInfluence. */
export function reconcileRivals(existing: RivalState[] | undefined): RivalState[] {
  const byId = new Map((existing ?? []).map((r) => [r.id, r]));
  return ALL_RIVAL_IDS.map((id) => {
    const def = RIVALS[id];
    const cur = byId.get(id);
    if (cur) {
      return {
        id,
        influence: Math.max(0, Math.min(100, cur.influence)),
        relation: Math.max(-100, Math.min(100, cur.relation)),
      };
    }
    return { id, influence: def.initialInfluence, relation: 0 };
  });
}

const INFLUENCE_CAP = 100;

/** Daily tick: grow each rival's influence (capped). Once per month per rival, fire an
 *  archetype-flavoured action with a log entry. */
export function advanceRivals(state: GameState, rng: Rng, monthChanged: boolean): void {
  for (const r of state.rivals) {
    const def = RIVALS[r.id];
    if (!def) continue;
    r.influence = Math.min(INFLUENCE_CAP, r.influence + def.influencePerDay);
    if (monthChanged) {
      fireMonthlyAction(state, r, def.archetype, rng);
    }
  }
}

function fireMonthlyAction(
  state: GameState,
  rival: RivalState,
  archetype: RivalArchetypeId,
  rng: Rng,
): void {
  const def = RIVALS[rival.id];
  // Higher-influence rivals act more visibly (modeled as a chance to fire at all).
  if (!rng.chance(0.35 + rival.influence / 200)) return;
  switch (archetype) {
    case "military": {
      pushLog(
        state,
        `${def.name} held a public tournament — ${def.leader}'s name spreads (rival influence +).`,
        "info",
      );
      rival.influence = Math.min(INFLUENCE_CAP, rival.influence + 2);
      break;
    }
    case "merchant": {
      // Mercantile rivals raise nearby prices: small gold drain on the player.
      const drain = Math.min(state.resources.gold, rng.int(2, 6));
      if (drain > 0) {
        state.resources.gold -= drain;
        pushLog(
          state,
          `${def.name} cornered a trade route — your costs went up (-${drain} gold).`,
          "bad",
        );
      }
      break;
    }
    case "spiritual": {
      pushLog(
        state,
        `${def.leader} of the ${def.name} reportedly achieved a breakthrough — pilgrims flock to their gates.`,
        "info",
      );
      rival.influence = Math.min(INFLUENCE_CAP, rival.influence + 3);
      break;
    }
    case "shadow": {
      // Shadow rivals occasionally bump the bandit_threat clock.
      const clock = state.worldClocks.find((c) => c.id === "bandit_threat");
      if (clock) {
        clock.progress = Math.min(45, clock.progress + 4);
      }
      pushLog(
        state,
        `Whispers in the valley name the ${def.name} behind a recent ambush. The roads are less safe.`,
        "bad",
      );
      break;
    }
    case "diplomatic": {
      pushLog(
        state,
        `${def.name} brokered an alliance with a local clan — influence grows quietly.`,
        "info",
      );
      rival.influence = Math.min(INFLUENCE_CAP, rival.influence + 2);
      break;
    }
  }
}
