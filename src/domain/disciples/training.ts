// Training grants XP (scaled by happiness) toward attribute stars, plus the basic v1 injury roll.

import {
  HAPPINESS_FULL,
  HAPPINESS_MID,
  GAIN_MULT_FULL,
  GAIN_MULT_MID,
  GAIN_MULT_LOW,
  INJURY_BASE_CHANCE,
  INJURY_DEX_FACTOR,
  INJURY_MIN_CHANCE,
  INJURY_DAMAGE_FRACTION,
} from "../../data/balance";
import { TRAIN_XP_ALL, TRAIN_XP_SECT_BONUS } from "../../data/progression";
import { ATTRIBUTES, type Attribute } from "../sect/sectTypes";
import { maxHp, type Disciple } from "./disciple";
import { addXp, effectiveLevel } from "./attributes";
import type { Rng } from "../../core/rng/rng";

/** How much of any XP gain a disciple keeps, based on happiness. */
export function happinessGainMultiplier(happiness: number): number {
  if (happiness >= HAPPINESS_FULL) return GAIN_MULT_FULL;
  if (happiness >= HAPPINESS_MID) return GAIN_MULT_MID;
  return GAIN_MULT_LOW;
}

/** Chance to be injured during a Train action; reduced by the Dexterity level. */
export function injuryChance(dexterityLevel: number): number {
  return Math.max(INJURY_MIN_CHANCE, INJURY_BASE_CHANCE - dexterityLevel * INJURY_DEX_FACTOR);
}

export interface TrainResult {
  injured: boolean;
  rankedUp: Attribute[];
}

/** Apply one Train action: XP to every attribute (+bonus on the sect's), then an injury roll. */
export function trainOnce(d: Disciple, sectAttr: Attribute, rng: Rng): TrainResult {
  const mult = happinessGainMultiplier(d.happiness);
  const rankedUp: Attribute[] = [];

  for (const attr of ATTRIBUTES) {
    const bonus = attr === sectAttr ? TRAIN_XP_SECT_BONUS : 0;
    const gain = (TRAIN_XP_ALL + bonus) * mult;
    if (addXp(d.attributes[attr], gain).rankedUp) rankedUp.push(attr);
  }

  let injured = false;
  if (rng.chance(injuryChance(effectiveLevel(d.attributes.dexterity)))) {
    injured = true;
    const damage = Math.max(1, Math.round(maxHp(d) * INJURY_DAMAGE_FRACTION));
    d.hp -= damage;
    if (d.hp <= 0) {
      d.hp = 0;
      d.status = "down";
    }
  }

  return { injured, rankedUp };
}
