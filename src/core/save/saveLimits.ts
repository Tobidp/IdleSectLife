// Hard caps applied to imported save data. Generous enough that any legitimately-earned
// progression fits, but tight enough that obviously-tampered or wildly-sized payloads are
// rejected before they reach the simulation loop.

export const SAVE_LIMITS = {
  /** Top-level save version we'll accept (the migrate path only handles v3+). */
  maxVersion: 1000,

  /** Per-resource ceiling. Late-game warehouse caps are ~13K at Lv 10; 1B is comfortable. */
  maxResource: 1_000_000_000,

  /** Disciples + applicants (rosters). */
  maxDisciples: 500,
  maxApplicants: 100,

  /** Each disciple's attribute progression. */
  maxAttrRank: 100,
  maxAttrStar: 20,
  maxAttrXp: 1_000_000_000,
  maxHp: 1_000_000,
  maxHappiness: 200,
  maxAge: 360 * 1000, // 1000 in-game years — way beyond lifespan
  maxBondsPerDisciple: 100,

  /** Buildings hard cap (TRAINING_HALL maxes at 5; this is the absolute permitted ceiling). */
  maxBuildingLevel: 100,
  maxSectLevel: 100,

  /** Lists that can grow with play. */
  maxLogEntries: 500,
  maxAchievements: 200,
  maxItemInventory: 5_000,
  maxBlueprints: 500,
  maxClues: 500,
  maxQuests: 500,
  maxFlags: 500,

  /** Generic textual limits. */
  maxNameLen: 60,
  maxLabelLen: 200,
  maxIdValue: 1_000_000,

  /** Fame / gold pacing. */
  maxFame: 1_000_000_000,
  maxGoldArrears: 1_000,

  /** Time. */
  maxYear: 100_000,
  maxTotalDays: 360 * 100_000,
} as const;
