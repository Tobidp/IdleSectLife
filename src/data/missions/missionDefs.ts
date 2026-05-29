// Mission definitions — multi-day expeditions disciples can be sent on. Each def carries
// the cost (duration + roster size), the recommended attribute totals for the assigned
// disciples (sum of effectiveLevel across the roster — under-spec'd is allowed but risky),
// and a resolve() handler that mutates state when the mission completes.
//
// resolve() is responsible for ALL outcome effects: rewards (resources, fame, blueprints),
// penalties (injury hp loss, trauma stamps), and pushing the log line that tells the player
// what happened. The runtime in domain/missions/missions.ts just calls it and pops the
// active entry.

import type { GameState } from "../../state/gameState";
import type { Disciple } from "../../domain/disciples/disciple";
import type { Rng } from "../../core/rng/rng";
import type { Attribute } from "../../domain/sect/sectTypes";
import { effectiveLevel } from "../../domain/disciples/attributes";
import { pushLog } from "../../state/log";

export type MissionDefId = "scout_road" | "clear_caves" | "tomb_expedition";

export type MissionRisk = "low" | "medium" | "high";

export interface MissionDef {
  id: MissionDefId;
  name: string;
  description: string;
  durationDays: number;
  /** Min/max disciples that can be assigned. */
  minDisciples: number;
  maxDisciples: number;
  risk: MissionRisk;
  /** Summed effectiveLevel across the assigned roster — informational, not gated. */
  recommended: Partial<Record<Attribute, number>>;
  /** Plain-English reward summary, shown in the panel. */
  rewardPreview: string;
  /** Called once when the mission's duration elapses. Mutates state in place. */
  resolve(state: GameState, assigned: Disciple[], rng: Rng): void;
}

// Roll quality: fraction in [0, 1] comparing assigned roster totals against recommended.
// 1.0 = at or above recommended on every called-out attribute, 0 = far below.
function rosterQuality(assigned: Disciple[], recommended: Partial<Record<Attribute, number>>): number {
  const entries = Object.entries(recommended) as [Attribute, number][];
  if (entries.length === 0) return 1;
  let total = 0;
  for (const [attr, rec] of entries) {
    const have = assigned.reduce((sum, d) => sum + effectiveLevel(d.attributes[attr]), 0);
    total += Math.min(1, have / Math.max(1, rec));
  }
  return total / entries.length;
}

function applyInjury(disciple: Disciple, damage: number): void {
  disciple.hp = Math.max(0, disciple.hp - damage);
  if (disciple.hp <= 0) disciple.status = "down";
}

const scout_road: MissionDef = {
  id: "scout_road",
  name: "Scout the trade road",
  description:
    "Walk the merchant road between the sect and the lowland villages. Report on bandit movements and pocket whatever herbs grow at the verges.",
  durationDays: 5,
  minDisciples: 1,
  maxDisciples: 1,
  risk: "low",
  recommended: { dexterity: 5 },
  rewardPreview: "+ 8–18 gold · + 4–10 herb · tiny injury risk",
  resolve(state, assigned, rng) {
    const q = rosterQuality(assigned, this.recommended);
    const goldGain = Math.round(8 + rng.next() * 10 * q);
    const herbGain = Math.round(4 + rng.next() * 6 * q);
    state.resources.gold += goldGain;
    state.resources.herb += herbGain;
    const d = assigned[0];
    if (q < 0.6 && rng.chance(0.3)) {
      const dmg = rng.int(10, 25);
      applyInjury(d, dmg);
      pushLog(
        state,
        `${d.name} returned from the road bruised (-${dmg} HP). They brought back ${goldGain} gold and ${herbGain} herb.`,
        "bad",
      );
    } else {
      pushLog(
        state,
        `${d.name} returned from the road with ${goldGain} gold and ${herbGain} herb.`,
        "good",
      );
    }
  },
};

const clear_caves: MissionDef = {
  id: "clear_caves",
  name: "Clear the river caves",
  description:
    "A nest of outlaws has set up in the caves by the river. Drive them out — the locals will reward the sect, and there are spoils worth carrying back.",
  durationDays: 12,
  minDisciples: 2,
  maxDisciples: 3,
  risk: "medium",
  recommended: { strength: 12, vitality: 10 },
  rewardPreview: "+ 30–80 gold · + 15–40 ore · + 6 fame · chance: blueprint · injury risk",
  resolve(state, assigned, rng) {
    const q = rosterQuality(assigned, this.recommended);
    const success = rng.chance(0.4 + q * 0.5); // 40–90% depending on prep
    if (success) {
      const gold = Math.round(30 + rng.next() * 50 * q);
      const ore = Math.round(15 + rng.next() * 25 * q);
      state.resources.gold += gold;
      state.resources.ore += ore;
      state.fame += 6;
      // Light injuries to a single member even on success.
      if (rng.chance(0.5)) {
        const wounded = rng.pick(assigned);
        const dmg = rng.int(15, 35);
        applyInjury(wounded, dmg);
        pushLog(
          state,
          `The river caves were cleared. ${wounded.name} took a wound (-${dmg} HP). Returned with ${gold} gold and ${ore} ore (+6 fame).`,
          "good",
        );
      } else {
        pushLog(
          state,
          `The river caves were cleared without serious injury. Returned with ${gold} gold and ${ore} ore (+6 fame).`,
          "good",
        );
      }
    } else {
      // Failure: heavy injuries to multiple members, minor consolation reward.
      for (const d of assigned) {
        const dmg = rng.int(25, 50);
        applyInjury(d, dmg);
      }
      const consolation = Math.round(10 + rng.next() * 15);
      state.resources.gold += consolation;
      pushLog(
        state,
        `The cave operation went badly. The roster returned wounded; ${consolation} gold scavenged on the retreat.`,
        "bad",
      );
    }
  },
};

const tomb_expedition: MissionDef = {
  id: "tomb_expedition",
  name: "Expedition to the sealed tomb",
  description:
    "An imperial-era tomb has been rumoured on the cold ridge. The seals are old. Whoever opens it first walks out with relics — or doesn't walk out at all.",
  durationDays: 20,
  minDisciples: 2,
  maxDisciples: 3,
  risk: "high",
  recommended: { strength: 25, vitality: 25, dexterity: 18 },
  rewardPreview: "+ 80–200 gold · + rare blueprint · + 12 fame · heavy injury risk · possible death",
  resolve(state, assigned, rng) {
    const q = rosterQuality(assigned, this.recommended);
    const success = rng.chance(0.25 + q * 0.6); // 25–85%
    if (success) {
      const gold = Math.round(80 + rng.next() * 120 * q);
      state.resources.gold += gold;
      state.fame += 12;
      // Always at least one disciple takes a serious wound here.
      const wounded = rng.pick(assigned);
      const dmg = rng.int(35, 60);
      applyInjury(wounded, dmg);
      pushLog(
        state,
        `The tomb expedition succeeded — ${gold} gold and trinkets worth +12 fame. ${wounded.name} bears a deep wound (-${dmg} HP).`,
        "good",
      );
    } else {
      // Catastrophic failure: each disciple takes very heavy damage; one may die outright.
      for (const d of assigned) {
        const dmg = rng.int(50, 90);
        applyInjury(d, dmg);
      }
      pushLog(
        state,
        `The tomb expedition ended in disaster. The seals held, the survivors fled, and the ridge keeps its secrets.`,
        "bad",
      );
    }
  },
};

export const ALL_MISSIONS: readonly MissionDef[] = [scout_road, clear_caves, tomb_expedition];

export function getMissionDef(id: MissionDefId): MissionDef | undefined {
  return ALL_MISSIONS.find((m) => m.id === id);
}
