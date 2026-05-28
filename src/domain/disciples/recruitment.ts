// Recruitment: a monthly roll produces an applicant who waits for the player's Accept/Deny.

import { createDisciple } from "./disciple";
import { SECT_TYPES } from "../sect/sectTypes";
import { disciplesCapacity } from "../buildings/buildings";
import { recruitChance } from "../fame/fame";
import { MAX_APPLICANTS, APPLICANT_EXPIRY_DAYS } from "../../data/balance";
import { pushLog } from "../../state/log";
import type { GameState } from "../../state/gameState";
import type { Rng } from "../../core/rng/rng";

/** Monthly roll: a wandering cultivator may show up seeking to join (queued for Accept/Deny). */
export function rollMonthlyApplicant(state: GameState, rng: Rng): void {
  if (state.applicants.length >= MAX_APPLICANTS) return;
  if (!rng.chance(recruitChance(state.fame))) return;

  const preferred = rng.pick(SECT_TYPES);
  const applicant = createDisciple(state.nextId++, preferred, state.sect.type, rng);
  applicant.arrivedOnDay = state.time.totalDays;
  state.applicants.push(applicant);
  pushLog(state, `A wandering cultivator, ${applicant.name}, seeks to join the sect.`, "good");
}

/** Days remaining until the applicant leaves on their own. Negative = already past due. */
export function applicantDaysLeft(state: GameState, arrivedOnDay: number | undefined): number {
  const arrived = arrivedOnDay ?? state.time.totalDays;
  return APPLICANT_EXPIRY_DAYS - (state.time.totalDays - arrived);
}

/** Remove applicants who've been waiting longer than APPLICANT_EXPIRY_DAYS. */
export function expireApplicants(state: GameState): void {
  if (state.applicants.length === 0) return;
  const stayed: typeof state.applicants = [];
  for (const a of state.applicants) {
    if (applicantDaysLeft(state, a.arrivedOnDay) > 0) {
      stayed.push(a);
    } else {
      pushLog(state, `${a.name} grew tired of waiting and moved on.`, "info");
    }
  }
  state.applicants = stayed;
}

/** Accept an applicant into the sect if there's room. Returns whether it succeeded. */
export function acceptApplicant(state: GameState, id: number): boolean {
  if (state.disciples.length >= disciplesCapacity(state)) return false;
  const idx = state.applicants.findIndex((a) => a.id === id);
  if (idx < 0) return false;
  const [applicant] = state.applicants.splice(idx, 1);
  state.disciples.push(applicant);
  pushLog(state, `${applicant.name} was accepted into the sect.`, "good");
  return true;
}

/** Turn an applicant away. */
export function denyApplicant(state: GameState, id: number): void {
  const idx = state.applicants.findIndex((a) => a.id === id);
  if (idx < 0) return;
  const [applicant] = state.applicants.splice(idx, 1);
  pushLog(state, `${applicant.name} was turned away.`, "info");
}
