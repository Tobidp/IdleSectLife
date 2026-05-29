// Runtime for personal events: per-day trigger rolls + resolve. The queue lives on the
// save (state.pendingPersonalEvents) so an event that surfaces but isn't answered carries
// across reloads. Limits:
//   - at most ONE pending event per disciple (avoids stacking)
//   - at most MAX_QUEUE pending events total (modal shows them one at a time)

import type { GameState } from "../../state/gameState";
import type { Rng } from "../../core/rng/rng";
import {
  ALL_PERSONAL_EVENTS,
  getPersonalEventDef,
  type PersonalEventId,
} from "../../data/disciples/personalEvents";
import { pushLog } from "../../state/log";

export interface PendingPersonalEvent {
  eventId: PersonalEventId;
  discipleId: number;
  /** totalDay the event surfaced — used to expire stale ones if we ever want to. */
  queuedOn: number;
}

/** Daily chance any one active disciple triggers a personal event. Kept low so the modal
 *  doesn't spam — most days produce nothing. */
const DAILY_ROLL_PER_DISCIPLE = 0.012;

/** Hard cap so a long away-from-tab session can't queue a hundred events. */
const MAX_QUEUE = 5;

/** Per-tick: roll each active disciple; if their roll wins and there's an eligible event
 *  they don't already have queued, push it onto pendingPersonalEvents. */
export function rollPersonalEvents(state: GameState, rng: Rng): void {
  if (state.pendingPersonalEvents.length >= MAX_QUEUE) return;
  const queuedIds = new Set(state.pendingPersonalEvents.map((p) => p.discipleId));
  for (const d of state.disciples) {
    if (d.status !== "active") continue;
    if (queuedIds.has(d.id)) continue;
    if (!rng.chance(DAILY_ROLL_PER_DISCIPLE)) continue;
    const eligible = ALL_PERSONAL_EVENTS.filter((e) => e.canFire(state, d));
    if (eligible.length === 0) continue;
    const def = rng.pick(eligible);
    state.pendingPersonalEvents.push({
      eventId: def.id,
      discipleId: d.id,
      queuedOn: state.time.totalDays,
    });
    pushLog(state, `${d.name} has a matter for you — see the personal event.`, "info");
    if (state.pendingPersonalEvents.length >= MAX_QUEUE) return;
  }
}

/** Resolve the front-of-queue event for `discipleId` by applying the chosen choice and
 *  removing the pending entry. Silently no-ops if the event is no longer valid. */
export function resolvePersonalEvent(
  state: GameState,
  discipleId: number,
  choiceId: string,
  rng: Rng,
): void {
  const idx = state.pendingPersonalEvents.findIndex((p) => p.discipleId === discipleId);
  if (idx < 0) return;
  const pending = state.pendingPersonalEvents[idx];
  const disciple = state.disciples.find((d) => d.id === discipleId);
  const def = getPersonalEventDef(pending.eventId);
  // Always pop the pending entry even if the disciple/event vanished — otherwise the
  // modal would loop on a stale row forever.
  state.pendingPersonalEvents.splice(idx, 1);
  if (!disciple || !def) return;
  const choice = def.choices.find((c) => c.id === choiceId);
  if (!choice) return;
  choice.apply(state, disciple, rng);
}
