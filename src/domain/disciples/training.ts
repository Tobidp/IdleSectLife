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
  TRIBULATION_AID_FAIL_MULT,
} from "../../data/balance";
import { TRAIN_XP_ALL, TRAIN_XP_SECT_BONUS } from "../../data/progression";
import { talentXpMult } from "../../data/talent";
import { traitXpMult, traitInjuryMult } from "../../data/traits";
import { ATTRIBUTES, type Attribute } from "../sect/sectTypes";
import { maxHp, type Disciple } from "./disciple";
import { addXp, effectiveLevel } from "./attributes";
import { attemptBreakthrough, type BreakthroughResult } from "./tribulation";
import { pathXpMultFor } from "./paths";
import { equipmentXpMult } from "../equipment/bonuses";
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

export interface TrainBreakthrough {
  attr: Attribute;
  result: BreakthroughResult;
}

export interface TrainResult {
  injured: boolean;
  breakthroughs: TrainBreakthrough[];
  /** True if a Tribulation Aid buff was consumed by one of the breakthroughs this tick. */
  tribulationAidConsumed: boolean;
}

/** Apply one Train action: XP to every attribute (+bonus on the sect's), tribulation rolls on
 * any attribute that hit 10★ this tick, then the usual injury roll. `extraMult` lets the
 * caller fold in environmental boosts (mentors, training hall, doctrine training mult);
 * `breakthroughFailMult` lets a Supremacy-style doctrine ease the tribulation fail chance. */
export function trainOnce(
  d: Disciple,
  sectAttr: Attribute,
  rng: Rng,
  extraMult = 1,
  breakthroughFailMult = 1,
): TrainResult {
  const mult =
    happinessGainMultiplier(d.happiness) * talentXpMult(d.talent) * traitXpMult(d.trait) * extraMult;
  const breakthroughs: TrainBreakthrough[] = [];
  let tribulationAidConsumed = false;

  for (const attr of ATTRIBUTES) {
    const bonus = attr === sectAttr ? TRAIN_XP_SECT_BONUS : 0;
    const gain = (TRAIN_XP_ALL + bonus) * mult * pathXpMultFor(d.path, attr) * equipmentXpMult(d, attr);
    if (addXp(d.attributes[attr], gain).readyToBreakthrough) {
      const failMult = (d.tribulationBuff ? TRIBULATION_AID_FAIL_MULT : 1) * breakthroughFailMult;
      const tr = attemptBreakthrough(
        d.attributes[attr],
        effectiveLevel(d.attributes.vitality),
        rng,
        failMult,
      );
      if (tr.attempted && d.tribulationBuff) {
        d.tribulationBuff = false;
        tribulationAidConsumed = true;
      }
      if (tr.attempted) {
        breakthroughs.push({ attr, result: tr });
        if (!tr.success && tr.hpDamageFraction) {
          d.hp -= Math.round(maxHp(d) * tr.hpDamageFraction);
          if (d.hp <= 0) {
            d.hp = 0;
            d.status = "down";
          }
        }
      }
    }
  }

  let injured = false;
  const baseInjury = injuryChance(effectiveLevel(d.attributes.dexterity));
  if (d.status === "active" && rng.chance(baseInjury * traitInjuryMult(d.trait))) {
    injured = true;
    const damage = Math.max(1, Math.round(maxHp(d) * INJURY_DAMAGE_FRACTION));
    d.hp -= damage;
    if (d.hp <= 0) {
      d.hp = 0;
      d.status = "down";
    }
  }

  return { injured, breakthroughs, tribulationAidConsumed };
}
