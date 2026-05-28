// Disciple data model and factory.

import type { SectType, Attribute } from "../sect/sectTypes";
import { ATTRIBUTES } from "../sect/sectTypes";
import type { Rng } from "../../core/rng/rng";
import { HAPPINESS_START_MATCH, HAPPINESS_START_MISMATCH } from "../../data/baseStats";
import { HP_BASE, HP_PER_LEVEL } from "../../data/balance";
import { createAttr, effectiveLevel, type AttrProgress } from "./attributes";
import { generateName } from "./names";
import { rollTalent, type TalentTier } from "../../data/talent";

/** One of the 3 daily action slots. */
export type Activity = "idle" | "train" | "collect_stone" | "collect_wood" | "collect_food";

export type Attributes = Record<Attribute, AttrProgress>;

/** "down" = incapacitated (hp <= 0): performs no actions and is at risk of death. */
export type DiscipleStatus = "active" | "down";

export interface Disciple {
  id: number;
  name: string;
  preferredSect: SectType;
  /** Spirit-root tier rolled at creation; scales every XP gain. */
  talent: TalentTier;
  attributes: Attributes;
  hp: number;
  happiness: number;
  actions: [Activity, Activity, Activity];
  status: DiscipleStatus;
}

export const DEFAULT_ACTIONS: [Activity, Activity, Activity] = [
  "collect_food",
  "collect_wood",
  "train",
];

/** maxHp grows with the Health and Vitality effective levels. */
export function maxHp(d: Disciple): number {
  const levels = effectiveLevel(d.attributes.health) + effectiveLevel(d.attributes.vitality);
  return Math.round(HP_BASE + levels * HP_PER_LEVEL);
}

function freshAttributes(): Attributes {
  const attrs = {} as Attributes;
  for (const a of ATTRIBUTES) attrs[a] = createAttr();
  return attrs;
}

/** Create a disciple. Happiness depends on whether their preferred sect matches the player's sect. */
export function createDisciple(
  id: number,
  preferredSect: SectType,
  playerSect: SectType,
  rng: Rng,
): Disciple {
  const matches = preferredSect === playerSect;
  const disciple: Disciple = {
    id,
    name: generateName(rng),
    preferredSect,
    talent: rollTalent(rng),
    attributes: freshAttributes(),
    hp: 0,
    happiness: matches ? HAPPINESS_START_MATCH : HAPPINESS_START_MISMATCH,
    actions: [...DEFAULT_ACTIONS],
    status: "active",
  };
  disciple.hp = maxHp(disciple);
  return disciple;
}
