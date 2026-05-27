// Central tuning knobs for the v1 simulation. All values are meant to be adjusted during playtesting.
// NOTE: combat/yield formulas use a disciple's *effective level* (rank*10 + star), see data/progression.ts.

// --- Collection (per action: yield = COLLECT_BASE_BY_RESOURCE[r] + strengthLevel * COLLECT_PER_LEVEL, x season) ---
// Deliberately small so warehouses don't fill instantly — the game should be a slow burn.
export const COLLECT_BASE_BY_RESOURCE: Record<"stone" | "wood" | "food", number> = {
  stone: 0.6,
  wood: 0.6,
  food: 0.3,
};
export const COLLECT_PER_LEVEL = 0.05;

// --- Food ---
export const FOOD_PER_DISCIPLE_PER_DAY = 0.5;

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
// Fame no longer trickles in daily. It accrues ONCE PER MONTH (sect level + happy disciples)
// so it grows ~30x slower than before and recruitment doesn't max out almost immediately.
// Discrete bursts on upgrades remain.
export const FAME_PER_SECT_LEVEL_PER_MONTH = 2;
export const FAME_PER_HAPPY_DISCIPLE_PER_MONTH = 0.5;
export const FAME_HAPPY_THRESHOLD = 75;
export const FAME_BURST_PER_PAVILION_LEVEL = 5;
export const FAME_BURST_PER_SECT_LEVEL = 20;

// --- Recruitment (rolled ONCE PER MONTH, not daily; produces an applicant to Accept/Deny) ---
export const RECRUIT_FAME_DIVISOR = 150; // chance/month = min(cap, fame / divisor)
export const RECRUIT_CHANCE_CAP = 0.9;
export const MAX_APPLICANTS = 5; // queue cap for pending applicants

// --- Gold upkeep (wages) & arrears ---
// Gold pays the monthly sect upkeep ("wages"). When it can't be covered, morale drops that
// month; if the debt drags on past the grace period, structures begin to decay.
export const WAGE_ARREARS_HAPPINESS_PENALTY = 8; // happiness lost by every disciple per unpaid month
export const WAGE_ARREARS_GRACE_MONTHS = 2; // consecutive unpaid months tolerated before decay starts
export const PASSIVE_GOLD_PER_MONTH = 1; // tiny passive gold trickle (deliberately almost nothing)
export const MERCHANT_SELL_BONUS_PER_LEVEL = 0.1; // auto-sell price x (1 + (level-1) * this)

// --- Offline progress (applied on return) ---
// Time away accrues at a reduced rate, capped, so closing the game isn't punished but also
// can't fast-forward years (a day is only ~3s of real time).
export const OFFLINE_RATE = 0.5; // fraction of the active day-rate earned while away
export const OFFLINE_MAX_DAYS = 180; // hard ceiling on simulated offline days (~6 months)

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
