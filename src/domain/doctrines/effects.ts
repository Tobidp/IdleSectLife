// Doctrine-effect lookup. Domain systems call doctrineMult(state, "trainingXpMult") and
// get either 1.0 (no doctrine, or the doctrine doesn't touch that effect) or the
// doctrine's chosen scale. This keeps doctrine logic in one place while every system
// that wants to opt in stays a single multiplier call away.

import type { GameState } from "../../state/gameState";
import { DOCTRINES, type DoctrineEffectId, type DoctrineId } from "../../data/doctrines/doctrineDefs";

/** Multiplicative effect with default 1.0 — wrap any value you want a doctrine to scale. */
export function doctrineMult(state: GameState, effect: DoctrineEffectId): number {
  if (!state.doctrine) return 1;
  return DOCTRINES[state.doctrine]?.mult[effect] ?? 1;
}

/** Has the player committed to a doctrine yet? */
export function hasDoctrine(state: GameState): boolean {
  return state.doctrine !== null;
}

/** Pick a doctrine for the run — irreversible. Returns false if a doctrine is already
 *  set (UI should never reach this path; defensive). */
export function pickDoctrine(state: GameState, id: DoctrineId): boolean {
  if (state.doctrine) return false;
  if (!DOCTRINES[id]) return false;
  state.doctrine = id;
  return true;
}

/** Eligibility for the doctrine pick — opens at sect level 2 so the player has played
 *  long enough to feel the tradeoff matter. */
export function canPickDoctrine(state: GameState): boolean {
  return state.doctrine === null && state.sect.level >= 2;
}
