// Runtime side of achievements: unlock newly-met ones and aggregate the permanent bonuses
// every formula in the game consults.

import type { GameState } from "../../state/gameState";
import { ACHIEVEMENTS, type Achievement } from "../../data/achievements";

/** Unlock any achievement whose condition is met for the first time. Mutates state. */
export function checkAchievements(state: GameState): Achievement[] {
  const unlocked: Achievement[] = [];
  for (const a of ACHIEVEMENTS) {
    if (state.achievements.includes(a.id)) continue;
    if (a.condition(state)) {
      state.achievements.push(a.id);
      unlocked.push(a);
    }
  }
  return unlocked;
}

/** Aggregate collect/fame multipliers from every unlocked achievement (each starts at 1). */
export function achievementMultipliers(state: GameState): { collect: number; fame: number } {
  let collect = 1;
  let fame = 1;
  const have = new Set(state.achievements);
  for (const a of ACHIEVEMENTS) {
    if (!have.has(a.id)) continue;
    if (a.bonus.collect) collect += a.bonus.collect;
    if (a.bonus.fame) fame += a.bonus.fame;
  }
  return { collect, fame };
}
