// A single attribute's progression: a rank (0..∞), a star within it (1..10), and XP toward the next star.

import {
  STARS_PER_RANK,
  STAR_XP_BASE,
  STAR_XP_GROWTH,
  RANK_XP_GROWTH,
} from "../../data/progression";

export interface AttrProgress {
  rank: number; // 0 = first rank
  star: number; // 1..STARS_PER_RANK
  xp: number; // progress toward the next star
}

export function createAttr(): AttrProgress {
  return { rank: 0, star: 1, xp: 0 };
}

/** A single ever-increasing number for gameplay formulas: rank*10 + star (1, 2, … 10, 11, …). */
export function effectiveLevel(a: AttrProgress): number {
  return a.rank * STARS_PER_RANK + a.star;
}

/** XP required to advance from the current star to the next (or to promote rank at 10★). */
export function xpForNextStar(a: AttrProgress): number {
  return STAR_XP_BASE * Math.pow(STAR_XP_GROWTH, a.star - 1) * Math.pow(RANK_XP_GROWTH, a.rank);
}

/** Fraction (0..1) of the way to the next star, for progress bars. */
export function progressFraction(a: AttrProgress): number {
  return Math.max(0, Math.min(1, a.xp / xpForNextStar(a)));
}

export interface XpResult {
  /** True when the disciple is at 10★ with a full XP bar, ready for the tribulation roll. */
  readyToBreakthrough: boolean;
}

/**
 * Add XP, advancing stars within the current rank. **Does not promote rank** — at 10★ the XP
 * caps at the breakthrough threshold and `readyToBreakthrough` flips on. The actual rank-up
 * goes through `attemptBreakthrough` (a separate, risky check) so cultivation has a real trial.
 */
export function addXp(a: AttrProgress, amount: number): XpResult {
  if (amount > 0) {
    a.xp += amount;
    let guard = 0;
    while (a.star < STARS_PER_RANK && a.xp >= xpForNextStar(a) && guard < 1000) {
      a.xp -= xpForNextStar(a);
      a.star += 1;
      guard += 1;
    }
    // At top star, hold xp at the breakthrough threshold rather than letting it accumulate.
    if (a.star === STARS_PER_RANK && a.xp > xpForNextStar(a)) {
      a.xp = xpForNextStar(a);
    }
  }
  return { readyToBreakthrough: a.star === STARS_PER_RANK && a.xp >= xpForNextStar(a) };
}
