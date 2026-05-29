// Tournament runtime: an auto-scheduled regional tournament with an entry window, a
// resolve phase that rolls per entry against the rival pool, and fame/gold payouts to
// the player based on their entrants' placements.
//
// One tournament in flight at a time. Currently uses a single hard-coded def so the
// shape stays light — adding more tournament types is just more entries in TOURNAMENTS.

import type { GameState } from "../../state/gameState";
import type { Rng } from "../../core/rng/rng";
import { effectiveLevel } from "../disciples/attributes";
import { pushLog } from "../../state/log";

export interface TournamentDef {
  id: string;
  name: string;
  /** Entry window: days after announcement during which the player can add disciples. */
  entryWindowDays: number;
  /** Days from announcement to resolution. */
  fullDurationDays: number;
  /** Max disciples the player can enter. */
  maxEntries: number;
  /** Rival baseline strength — the player must beat this number to win. */
  baselineRivalStrength: number;
}

export const TOURNAMENTS: Record<string, TournamentDef> = {
  regional: {
    id: "regional",
    name: "Regional Tournament",
    entryWindowDays: 20,
    fullDurationDays: 30,
    maxEntries: 3,
    baselineRivalStrength: 30,
  },
};

export interface ActiveTournament {
  defId: string;
  announcedOn: number;
  resolvesOn: number;
  entryDeadline: number;
  /** Disciple ids the player has entered (locked once entryDeadline passes). */
  entries: number[];
}

const TOURNAMENT_INTERVAL_DAYS = 180;
const FIRST_TOURNAMENT_EARLIEST_DAY = 80;

/** Per-day check: schedule a new tournament if none is active and enough time has
 *  passed since the last one. */
export function rollTournamentSchedule(state: GameState, _rng: Rng): void {
  if (state.activeTournament) return;
  if (state.time.totalDays < FIRST_TOURNAMENT_EARLIEST_DAY) return;
  if (
    state.lastTournamentDay !== null &&
    state.time.totalDays - state.lastTournamentDay < TOURNAMENT_INTERVAL_DAYS
  ) {
    return;
  }
  const def = TOURNAMENTS.regional;
  state.activeTournament = {
    defId: def.id,
    announcedOn: state.time.totalDays,
    resolvesOn: state.time.totalDays + def.fullDurationDays,
    entryDeadline: state.time.totalDays + def.entryWindowDays,
    entries: [],
  };
  pushLog(
    state,
    `[Tournament] ${def.name} announced — enter up to ${def.maxEntries} disciples within ${def.entryWindowDays} days.`,
    "info",
  );
}

/** Per-day check: if the active tournament's resolve day has arrived, run it. */
export function resolveDueTournament(state: GameState, rng: Rng): void {
  const t = state.activeTournament;
  if (!t) return;
  if (state.time.totalDays < t.resolvesOn) return;
  const def = TOURNAMENTS[t.defId];
  state.activeTournament = null;
  state.lastTournamentDay = state.time.totalDays;
  if (!def) return;
  if (t.entries.length === 0) {
    pushLog(state, `The ${def.name} concluded — your sect sent no entrants.`, "info");
    return;
  }
  // Score each entry: sum of physical attribute levels + small luck roll.
  let totalWins = 0;
  let totalLosses = 0;
  let bestWinner: string | null = null;
  let bestScore = 0;
  for (const id of t.entries) {
    const d = state.disciples.find((x) => x.id === id);
    if (!d) continue;
    const skill =
      effectiveLevel(d.attributes.strength) +
      effectiveLevel(d.attributes.dexterity) +
      effectiveLevel(d.attributes.vitality);
    const score = skill + rng.int(0, 15);
    if (score > def.baselineRivalStrength) {
      totalWins += 1;
      if (score > bestScore) {
        bestScore = score;
        bestWinner = d.name;
      }
    } else {
      totalLosses += 1;
      // Light injury to the loser.
      const dmg = rng.int(5, 18);
      d.hp = Math.max(1, d.hp - dmg);
    }
  }
  const fame = totalWins * 8 + (bestWinner ? 6 : 0);
  const gold = totalWins * 12;
  state.fame += fame;
  state.resources.gold += gold;
  pushLog(
    state,
    `The ${def.name} ended: ${totalWins} win${totalWins === 1 ? "" : "s"}, ${totalLosses} loss${totalLosses === 1 ? "" : "es"}` +
      (bestWinner ? `; top placement to ${bestWinner}` : "") +
      ` (+${fame} fame, +${gold} gold).`,
    totalWins > 0 ? "good" : "bad",
  );
}

/** Add a disciple to the active tournament's entry list. Validation: tournament active,
 *  before deadline, disciple active and not already entered. */
export function enterTournament(state: GameState, discipleId: number): boolean {
  const t = state.activeTournament;
  if (!t) return false;
  if (state.time.totalDays > t.entryDeadline) return false;
  const def = TOURNAMENTS[t.defId];
  if (!def) return false;
  if (t.entries.length >= def.maxEntries) return false;
  if (t.entries.includes(discipleId)) return false;
  const d = state.disciples.find((x) => x.id === discipleId);
  if (!d || d.status !== "active") return false;
  t.entries.push(discipleId);
  return true;
}

export function withdrawTournamentEntry(state: GameState, discipleId: number): boolean {
  const t = state.activeTournament;
  if (!t) return false;
  if (state.time.totalDays > t.entryDeadline) return false;
  const before = t.entries.length;
  t.entries = t.entries.filter((id) => id !== discipleId);
  return t.entries.length !== before;
}
