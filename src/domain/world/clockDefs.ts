// Definitions for each world-pressure clock the simulation tracks. A WorldClock advances
// every day (advanceWorldClocks) and fires its onComplete handler when it reaches its
// threshold — pushing a log line, mutating state, and resetting for the next cycle.
//
// Adding a new clock: define it here, add the id to ClockId, and include the initial
// instance in createInitialClocks() in clocks.ts.

import type { GameState } from "../../state/gameState";
import type { Rng } from "../../core/rng/rng";
import { pushLog } from "../../state/log";
import type { ResourceType } from "../resources/resourceTypes";

export type ClockId = "bandit_threat" | "imperial_inspection";

export type ClockSeverity = "low" | "medium" | "high";

export interface ClockDef {
  id: ClockId;
  name: string;
  description: string;
  severity: ClockSeverity;
  /** Days from 0 to fire. Higher = slower. */
  threshold: number;
  /** Called when the clock reaches its threshold. Resets progress after returning. */
  onComplete(state: GameState, rng: Rng): void;
}

/** Resources bandits will try to steal — keep to ones with meaningful in-game scarcity. */
const STEALABLE: ResourceType[] = ["wood", "stone", "food", "gold", "herb", "ore"];

const BANDIT_STEAL_MIN_PCT = 0.05;
const BANDIT_STEAL_MAX_PCT = 0.15;

const INSPECTION_FAME_REQ = 50;
const INSPECTION_GOLD_REQ = 30;
const INSPECTION_FAME_REWARD = 20;
const INSPECTION_FAME_PENALTY = 30;

export const CLOCK_DEFS: Record<ClockId, ClockDef> = {
  bandit_threat: {
    id: "bandit_threat",
    name: "Bandit threat",
    description:
      "Outlaws watch the roads to your sect. When the threat boils over they raid the stores.",
    severity: "medium",
    threshold: 45,
    onComplete: (state, rng) => {
      const stealable = STEALABLE.filter((r) => state.resources[r] > 0);
      if (stealable.length === 0) {
        pushLog(
          state,
          "Bandits crept into the sect at night but found nothing worth taking.",
          "info",
        );
        return;
      }
      const resource = rng.pick(stealable);
      const pct = BANDIT_STEAL_MIN_PCT + rng.next() * (BANDIT_STEAL_MAX_PCT - BANDIT_STEAL_MIN_PCT);
      const stolen = Math.max(1, Math.floor(state.resources[resource] * pct));
      state.resources[resource] = Math.max(0, state.resources[resource] - stolen);
      pushLog(state, `Bandits raided the stores and made off with ${stolen} ${resource}.`, "bad");
    },
  },
  imperial_inspection: {
    id: "imperial_inspection",
    name: "Imperial inspection",
    description:
      "An imperial envoy will visit to weigh the sect's standing. Bring fame and gold or pay the price.",
    severity: "high",
    threshold: 360,
    onComplete: (state, _rng) => {
      const passes = state.fame >= INSPECTION_FAME_REQ && state.resources.gold >= INSPECTION_GOLD_REQ;
      if (passes) {
        state.fame += INSPECTION_FAME_REWARD;
        state.resources.gold = Math.max(0, state.resources.gold - INSPECTION_GOLD_REQ);
        pushLog(
          state,
          `The imperial inspection went well — the envoy endorses your sect (+${INSPECTION_FAME_REWARD} fame).`,
          "good",
        );
      } else {
        state.fame = Math.max(0, state.fame - INSPECTION_FAME_PENALTY);
        pushLog(
          state,
          `The imperial inspection was a disaster — the envoy left unimpressed (−${INSPECTION_FAME_PENALTY} fame).`,
          "bad",
        );
      }
    },
  },
};

export const ALL_CLOCK_IDS: ClockId[] = ["bandit_threat", "imperial_inspection"];
