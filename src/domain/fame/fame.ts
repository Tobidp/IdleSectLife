// Fame accrual and how it drives recruitment.

import {
  FAME_PER_HAPPY_DISCIPLE_PER_DAY,
  FAME_HAPPY_THRESHOLD,
  RECRUIT_FAME_DIVISOR,
  RECRUIT_CHANCE_CAP,
} from "../../data/balance";
import { sectFamePerDay } from "../sect/sect";
import type { GameState } from "../../state/gameState";

/** Fame gained passively per day: sect level + happy, active disciples. */
export function passiveFamePerDay(state: GameState): number {
  let fame = sectFamePerDay(state.sect.level);
  for (const d of state.disciples) {
    if (d.status === "active" && d.happiness >= FAME_HAPPY_THRESHOLD) {
      fame += FAME_PER_HAPPY_DISCIPLE_PER_DAY;
    }
  }
  return fame;
}

/** Daily chance to attract a new disciple. */
export function recruitChance(fame: number): number {
  return Math.min(RECRUIT_CHANCE_CAP, fame / RECRUIT_FAME_DIVISOR);
}
