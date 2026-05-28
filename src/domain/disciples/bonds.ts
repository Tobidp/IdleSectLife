// Bonds: friendships between disciples. Form slowly over time (one tries to form each month);
// each bond raises the bonded disciples' happiness target. Losing a bonded partner hurts.

import type { GameState } from "../../state/gameState";
import type { Disciple } from "./disciple";
import type { Rng } from "../../core/rng/rng";
import { BOND_MONTHLY_CHANCE, BOND_MOURN_PENALTY } from "../../data/balance";
import { pushLog } from "../../state/log";

/** Try to form one new mutual bond between two random active disciples this month. */
export function rollMonthlyBond(state: GameState, rng: Rng): void {
  if (!rng.chance(BOND_MONTHLY_CHANCE)) return;
  const pool = state.disciples.filter((d) => d.status === "active");
  if (pool.length < 2) return;

  const a = pool[Math.floor(rng.next() * pool.length)];
  const candidates = pool.filter((p) => p.id !== a.id && !a.bonds.includes(p.id));
  if (candidates.length === 0) return;
  const b = candidates[Math.floor(rng.next() * candidates.length)];

  a.bonds.push(b.id);
  b.bonds.push(a.id);
  pushLog(state, `${a.name} and ${b.name} forged a bond.`, "good");
}

/** When disciples leave/die, surviving bonded partners mourn (one-time happiness hit + broken bond). */
export function mournLost(
  state: GameState,
  lost: Disciple[],
  reason: (survivor: Disciple, lost: Disciple) => string,
): void {
  if (lost.length === 0) return;
  const lostIds = new Set(lost.map((l) => l.id));
  for (const survivor of state.disciples) {
    const brokenIds = survivor.bonds.filter((id) => lostIds.has(id));
    if (brokenIds.length === 0) continue;
    survivor.bonds = survivor.bonds.filter((id) => !lostIds.has(id));
    survivor.happiness = Math.max(0, survivor.happiness - BOND_MOURN_PENALTY * brokenIds.length);
    for (const lostDisc of lost) {
      if (brokenIds.includes(lostDisc.id)) {
        pushLog(state, reason(survivor, lostDisc), "bad");
      }
    }
  }
}
