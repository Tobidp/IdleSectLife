// Attribute progression: stars (1..10) within a rank, ranks above stars (endless growth).
// All values are tunable for playtesting.

export const STARS_PER_RANK = 10;

// XP to advance one star: STAR_XP_BASE * STAR_XP_GROWTH^(star-1) * RANK_XP_GROWTH^rank.
// Tuned so a non-sect attribute climbs rank 0 (1★→10★) in ~1 game-year at 3 XP/day.
export const STAR_XP_BASE = 27;
export const STAR_XP_GROWTH = 1.35; // each star costs more — slow near 10★
export const RANK_XP_GROWTH = 2.0; // each rank ~2× slower than the previous

// XP granted per Train action (before the happiness multiplier).
export const TRAIN_XP_ALL = 1; // to every attribute
export const TRAIN_XP_SECT_BONUS = 2; // extra on the sect's attribute -> ~3× faster

// XP granted per Collect action to Strength (manual labour). ~25% of a train tick.
export const COLLECT_XP = 0.25;

// Cultivation realms used as rank names. Beyond the list, names are generated.
export const RANK_NAMES = [
  "Mortal",
  "Body Tempering",
  "Qi Gathering",
  "Foundation",
  "Core Formation",
  "Golden Core",
  "Nascent Soul",
  "Soul Formation",
  "Spirit Severing",
  "Dao Seeking",
  "Immortal Ascension",
];

export function rankName(rank: number): string {
  return RANK_NAMES[rank] ?? `Transcendent ${rank - RANK_NAMES.length + 2}`;
}

/** A colour tier (CSS class) for a rank, echoing the item-rarity colours. */
export function rankTierClass(rank: number): string {
  const tiers = ["rank-gray", "rank-green", "rank-blue", "rank-purple", "rank-gold"];
  return tiers[Math.min(tiers.length - 1, Math.floor(rank / 2))];
}
