// Central tuning knobs for the v1 simulation. All values are meant to be adjusted during playtesting.
// NOTE: combat/yield formulas use a disciple's *effective level* (rank*10 + star), see data/progression.ts.

// --- Collection (yield = COLLECT_BASE + strengthLevel * COLLECT_PER_LEVEL) ---
export const COLLECT_BASE = 5;
export const COLLECT_PER_LEVEL = 2;

// --- Food ---
export const FOOD_PER_DISCIPLE_PER_DAY = 1;

// --- Happiness -> gain multiplier (applied to all XP earned) ---
export const HAPPINESS_FULL = 75; // >= -> full gain
export const HAPPINESS_MID = 50; // >= -> half gain; below -> low gain
export const GAIN_MULT_FULL = 1;
export const GAIN_MULT_MID = 0.5;
export const GAIN_MULT_LOW = 0.1;

// --- Happiness daily dynamics ---
export const HAPPINESS_TARGET_MATCH = 90;
export const HAPPINESS_TARGET_MISMATCH = 55;
export const HAPPINESS_DRIFT = 2;
export const HAPPINESS_SHORTAGE_PENALTY = 10;

// --- Abandonment (when happiness is below ABANDON_THRESHOLD) ---
export const ABANDON_THRESHOLD = 50;
export const ABANDON_DIVISOR = 100; // dailyLeaveChance = (threshold - happiness) / divisor

// --- Fame ---
export const FAME_PER_HAPPY_DISCIPLE_PER_DAY = 0.1;
export const FAME_HAPPY_THRESHOLD = 75;
export const FAME_BURST_PER_PAVILION_LEVEL = 5;
export const FAME_BURST_PER_SECT_LEVEL = 20;

// --- Recruitment ---
export const RECRUIT_FAME_DIVISOR = 200;
export const RECRUIT_CHANCE_CAP = 0.9;

// --- HP pool (maxHp = HP_BASE + (healthLevel + vitalityLevel) * HP_PER_LEVEL) ---
export const HP_BASE = 20;
export const HP_PER_LEVEL = 5;

// --- Injury / healing / death (v1 basic), scaled by effective level ---
export const INJURY_BASE_CHANCE = 0.05; // per Train action
export const INJURY_DEX_FACTOR = 0.004; // chance = max(min, base - dexterityLevel * factor)
export const INJURY_MIN_CHANCE = 0.01;
export const INJURY_DAMAGE_FRACTION = 0.25; // HP lost on injury, fraction of maxHp
export const HEAL_BASE = 4; // HP regained per day
export const HEAL_LEVEL_FACTOR = 0.6; // healRate = base + vitalityLevel * factor
export const DEATH_BASE_CHANCE = 0.04; // per day while "down" (hp <= 0)
export const DEATH_LEVEL_FACTOR = 0.003; // chance = max(min, base - vitalityLevel * factor)
export const DEATH_MIN_CHANCE = 0.005;

// --- Event log ---
export const LOG_MAX_ENTRIES = 100;
