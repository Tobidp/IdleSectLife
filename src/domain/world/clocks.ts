// Runtime for the WorldClock system: holds each clock's current progress in the save
// and ticks them once per day. When a clock reaches its threshold its onComplete handler
// fires (push log, mutate state) and the clock resets to start the next cycle.

import type { GameState } from "../../state/gameState";
import type { Rng } from "../../core/rng/rng";
import { ALL_CLOCK_IDS, CLOCK_DEFS, type ClockId } from "./clockDefs";

export interface WorldClock {
  id: ClockId;
  /** Current progress, 0..threshold. Resets to 0 on completion. */
  progress: number;
  /** Number of times this clock has completed since the run started. Drives escalation. */
  cycles: number;
}

export function createInitialClocks(): WorldClock[] {
  return ALL_CLOCK_IDS.map((id) => ({ id, progress: 0, cycles: 0 }));
}

/** Idempotently ensure `state.worldClocks` contains every known clock id. New clocks
 *  added to the codebase appear at progress 0 on the next load. Used by save migration. */
export function reconcileWorldClocks(clocks: WorldClock[] | undefined): WorldClock[] {
  const existing = new Map((clocks ?? []).map((c) => [c.id, c]));
  return ALL_CLOCK_IDS.map((id) => {
    const e = existing.get(id);
    if (e) return { id, progress: Math.max(0, e.progress), cycles: Math.max(0, e.cycles) };
    return { id, progress: 0, cycles: 0 };
  });
}

/** Advance every clock by one day; fire onComplete handlers that crossed their threshold. */
export function advanceWorldClocks(state: GameState, rng: Rng): void {
  for (const clock of state.worldClocks) {
    const def = CLOCK_DEFS[clock.id];
    if (!def) continue; // unknown id from an older codebase — ignore
    clock.progress += 1;
    if (clock.progress >= def.threshold) {
      def.onComplete(state, rng);
      clock.progress = 0;
      clock.cycles += 1;
    }
  }
}
