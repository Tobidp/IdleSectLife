// Fame accrual and how it drives recruitment.

import {
  FAME_PER_SECT_LEVEL_PER_MONTH,
  FAME_PER_HAPPY_DISCIPLE_PER_MONTH,
  FAME_HAPPY_THRESHOLD,
  RECRUIT_FAME_DIVISOR,
  RECRUIT_CHANCE_CAP,
} from "../../data/balance";
import type { GameState } from "../../state/gameState";

/** Fame gained once per month: sect level + happy, active disciples. */
export function monthlyFameGain(state: GameState): number {
  let fame = FAME_PER_SECT_LEVEL_PER_MONTH * state.sect.level;
  for (const d of state.disciples) {
    if (d.status === "active" && d.happiness >= FAME_HAPPY_THRESHOLD) {
      fame += FAME_PER_HAPPY_DISCIPLE_PER_MONTH;
    }
  }
  return fame;
}

/** Monthly chance to attract a new disciple. */
export function recruitChance(fame: number): number {
  return Math.min(RECRUIT_CHANCE_CAP, fame / RECRUIT_FAME_DIVISOR);
}
