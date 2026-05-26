// Sect-level logic: attribute mapping, upgrade cost/effect, passive fame.

import { SECT, scaledCost, type Cost } from "../../data/costs";
import { FAME_BURST_PER_SECT_LEVEL } from "../../data/balance";
import { SECT_ATTRIBUTE, type Attribute } from "./sectTypes";
import { spend } from "../resources/resources";
import { pushLog } from "../../state/log";
import type { GameState } from "../../state/gameState";

export function sectAttribute(state: GameState): Attribute {
  return SECT_ATTRIBUTE[state.sect.type];
}

export function sectUpgradeCost(level: number): Cost {
  return scaledCost(SECT.baseCost, level);
}

/** Passive fame per day granted by the sect's current level. */
export function sectFamePerDay(level: number): number {
  return SECT.famePerLevelPerDay * level;
}

export function upgradeSect(state: GameState): boolean {
  const cost = sectUpgradeCost(state.sect.level);
  if (!spend(state, cost)) return false;
  state.sect.level += 1;
  state.fame += FAME_BURST_PER_SECT_LEVEL;
  pushLog(state, `Sect ascended to level ${state.sect.level}! Fame surges.`, "good");
  return true;
}
