// Mentors: every disciple with any attribute at MENTOR_RANK_THRESHOLD or above contributes a
// flat XP boost to all other disciples (capped). The boost is applied once-per-day in advanceDay.

import type { GameState } from "../../state/gameState";
import {
  MENTOR_BONUS_PER,
  MENTOR_BONUS_CAP,
  MENTOR_RANK_THRESHOLD,
} from "../../data/balance";

/** Fractional XP bonus from all qualifying mentors (e.g., 0.15 = +15%). */
export function mentorBoost(state: GameState): number {
  let mentors = 0;
  for (const d of state.disciples) {
    if (d.status !== "active") continue;
    for (const attr of Object.values(d.attributes)) {
      if (attr.rank >= MENTOR_RANK_THRESHOLD) {
        mentors++;
        break;
      }
    }
  }
  return Math.min(MENTOR_BONUS_CAP, mentors * MENTOR_BONUS_PER);
}
