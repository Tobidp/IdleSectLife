// Offline progress: on return, accrue the time away at a reduced rate, capped, by replaying
// advanceDay. Returns a summary for the "welcome back" notice (or null if nothing accrued).

import type { GameState } from "../../state/gameState";
import type { Rng } from "../../core/rng/rng";
import { advanceDay } from "./advanceDay";
import { DAY_DURATION_MS } from "../../core/loop/gameLoop";
import { OFFLINE_RATE, OFFLINE_MAX_DAYS } from "../../data/balance";

export interface OfflineSummary {
  days: number;
  fame: number;
  gold: number;
  disciples: number;
}

/** How many offline days are owed for the elapsed wall-clock time (reduced + capped). */
export function offlineDaysFor(elapsedMs: number): number {
  if (elapsedMs <= 0) return 0;
  const raw = Math.floor((elapsedMs / DAY_DURATION_MS) * OFFLINE_RATE);
  return Math.min(raw, OFFLINE_MAX_DAYS);
}

/** Replay the owed offline days into `state`. Returns the gains, or null if none. */
export function simulateOffline(state: GameState, rng: Rng): OfflineSummary | null {
  const days = offlineDaysFor(Date.now() - (state.lastPlayed ?? Date.now()));
  if (days <= 0) return null;

  const before = {
    fame: state.fame,
    gold: state.resources.gold,
    disciples: state.disciples.length,
  };
  for (let i = 0; i < days; i++) advanceDay(state, rng);

  return {
    days,
    fame: state.fame - before.fame,
    gold: state.resources.gold - before.gold,
    disciples: state.disciples.length - before.disciples,
  };
}
