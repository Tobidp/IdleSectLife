// Aging & natural death: each disciple ages one day per tick; cultivation extends lifespan.
// Past lifespan the daily death chance ramps with overage, capped so it isn't instant.

import type { Disciple } from "./disciple";
import { ATTRIBUTES } from "../sect/sectTypes";
import {
  LIFESPAN_BASE_DAYS,
  LIFESPAN_PER_RANK_DAYS,
  NATURAL_DEATH_FLOOR,
  NATURAL_DEATH_RAMP,
  NATURAL_DEATH_CAP,
} from "../../data/balance";

export function maxAttrRank(d: Disciple): number {
  let best = 0;
  for (const attr of ATTRIBUTES) {
    if (d.attributes[attr].rank > best) best = d.attributes[attr].rank;
  }
  return best;
}

/** Expected lifespan in days; cultivation extends it. */
export function lifespan(d: Disciple): number {
  return LIFESPAN_BASE_DAYS + maxAttrRank(d) * LIFESPAN_PER_RANK_DAYS;
}

/** Years (in-game) — UI helper, 360 days = 1 year. */
export function ageInYears(d: Disciple): number {
  return Math.floor(d.age / 360);
}

/** Daily chance of natural death once a disciple is past their lifespan. */
export function naturalDeathChance(d: Disciple): number {
  const life = lifespan(d);
  if (d.age <= life) return 0;
  const overage = (d.age - life) / life;
  return Math.min(NATURAL_DEATH_CAP, NATURAL_DEATH_FLOOR + overage * NATURAL_DEATH_RAMP);
}
