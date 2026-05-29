// Crisis runtime: schedule announced crises with a lead time, fire them on the
// trigger day. Only one crisis pending at a time so the UI surface stays light.

import type { GameState } from "../../state/gameState";
import type { Rng } from "../../core/rng/rng";
import { ALL_CRISIS_IDS, CRISES, type CrisisId } from "../../data/crises/crisisDefs";
import { pushLog } from "../../state/log";

export interface ScheduledCrisis {
  defId: CrisisId;
  /** totalDay the crisis fires. The announcement is pushed when the entry is created. */
  scheduledFor: number;
}

/** Earliest day a crisis can be scheduled — gives a new player time to ramp before
 *  the world starts throwing curveballs. */
const FIRST_CRISIS_EARLIEST_DAY = 60;

/** Per-day check: if it's been long enough since the last crisis fired (or scheduled),
 *  pick a new one and queue it with its def's prep time. */
export function rollCrisisSchedule(state: GameState, rng: Rng): void {
  if (state.scheduledCrises.length > 0) return;
  if (state.time.totalDays < FIRST_CRISIS_EARLIEST_DAY) return;
  // Roll only on month boundaries — small steady chance per month past the gate.
  if (state.time.day !== 1) return;
  const monthsSinceStart = Math.max(0, Math.floor(state.time.totalDays / 30));
  if (monthsSinceStart < FIRST_CRISIS_EARLIEST_DAY / 30) return;
  // ~25% chance per month past the gate; rises a touch with months passed.
  const chance = Math.min(0.5, 0.25 + monthsSinceStart * 0.01);
  if (!rng.chance(chance)) return;
  const defId = rng.pick(ALL_CRISIS_IDS);
  const def = CRISES[defId];
  state.scheduledCrises.push({
    defId,
    scheduledFor: state.time.totalDays + def.prepTimeDays,
  });
  pushLog(state, `[Crisis incoming] ${def.name}: ${def.announcement}`, "bad");
  // Suppress the SCHEDULE_INTERVAL by not rolling again until this crisis fires.
}

/** Per-day check: fire any scheduled crisis whose day has arrived. */
export function fireDueCrises(state: GameState, rng: Rng): void {
  if (state.scheduledCrises.length === 0) return;
  const due = state.scheduledCrises.filter((c) => state.time.totalDays >= c.scheduledFor);
  for (const sc of due) {
    const def = CRISES[sc.defId];
    if (def) def.resolve(state, rng);
  }
  state.scheduledCrises = state.scheduledCrises.filter((c) => state.time.totalDays < c.scheduledFor);
}
