// Crisis definitions — scheduled, announced events that test specific systems. Each
// crisis is announced prepTimeDays in advance so the player can react (build infirmary,
// stockpile food, save gold). When the trigger day arrives, resolve() applies the
// consequence, scaled by whatever preparation the player put in.

import type { GameState } from "../../state/gameState";
import type { Rng } from "../../core/rng/rng";
import { pushLog } from "../../state/log";

export type CrisisId = "harsh_winter" | "epidemic" | "bandit_siege";

export interface CrisisDef {
  id: CrisisId;
  name: string;
  announcement: string;
  prepTimeDays: number;
  resolve(state: GameState, rng: Rng): void;
}

export const CRISES: Record<CrisisId, CrisisDef> = {
  harsh_winter: {
    id: "harsh_winter",
    name: "Harsh Winter",
    announcement:
      "The geomancers report a brutal winter ahead. Stockpile food — production will fall and consumption will rise.",
    prepTimeDays: 30,
    resolve(state) {
      // Take ~30 days of food up-front. Cushioned if the sect has a herb garden.
      const consumption = state.disciples.length * 12;
      const buffer = state.buildings.herbGarden.level * 8;
      const drain = Math.max(0, consumption - buffer);
      const actualDrain = Math.min(state.resources.food, drain);
      state.resources.food -= actualDrain;
      if (drain > actualDrain) {
        // Shortage hits morale.
        for (const d of state.disciples) {
          if (d.status !== "active") continue;
          d.happiness = Math.max(0, d.happiness - 15);
        }
        pushLog(
          state,
          `Harsh Winter struck. Stores emptied (-${actualDrain} food); morale fell across the sect.`,
          "bad",
        );
      } else {
        pushLog(state, `Harsh Winter passed — stores held (-${actualDrain} food).`, "info");
      }
    },
  },
  epidemic: {
    id: "epidemic",
    name: "Epidemic",
    announcement:
      "Word of a regional sickness reaches the sect. Build or expand the Infirmary — the cost of treating it without one is heavy.",
    prepTimeDays: 24,
    resolve(state, rng) {
      const infirmaryLevel = state.buildings.infirmary.level;
      const infectChance = Math.max(0.1, 0.5 - infirmaryLevel * 0.08);
      let infected = 0;
      for (const d of state.disciples) {
        if (d.status !== "active") continue;
        if (rng.chance(infectChance)) {
          const dmg = Math.round(d.hp * (0.3 - infirmaryLevel * 0.04));
          d.hp = Math.max(1, d.hp - dmg);
          infected += 1;
        }
      }
      if (infected > 0) {
        pushLog(
          state,
          `Epidemic swept the sect — ${infected} disciple${infected === 1 ? "" : "s"} fell ill (infirmary Lv ${infirmaryLevel} mitigated the worst).`,
          "bad",
        );
      } else {
        pushLog(state, "The epidemic passed the sect by without casualties.", "good");
      }
    },
  },
  bandit_siege: {
    id: "bandit_siege",
    name: "Bandit Siege",
    announcement:
      "Bandits are massing in the foothills. Buy them off (50 gold) or fortify and face them — under-equipped, they take the stores.",
    prepTimeDays: 18,
    resolve(state, rng) {
      const bribe = 50;
      if (state.resources.gold >= bribe) {
        state.resources.gold -= bribe;
        pushLog(state, `The bandits accepted ${bribe} gold and dispersed. The sect was spared.`, "info");
        return;
      }
      // No gold → they raid.
      const stoneTaken = Math.min(state.resources.stone, Math.floor(state.resources.stone * 0.3));
      const woodTaken = Math.min(state.resources.wood, Math.floor(state.resources.wood * 0.3));
      state.resources.stone -= stoneTaken;
      state.resources.wood -= woodTaken;
      // Random disciple takes hits.
      const active = state.disciples.filter((d) => d.status === "active");
      if (active.length > 0) {
        const wounded = rng.pick(active);
        const dmg = rng.int(20, 40);
        wounded.hp = Math.max(0, wounded.hp - dmg);
        if (wounded.hp <= 0) wounded.status = "down";
        pushLog(
          state,
          `The bandits raided unchecked — ${stoneTaken} stone + ${woodTaken} wood lost, ${wounded.name} wounded.`,
          "bad",
        );
      } else {
        pushLog(
          state,
          `The bandits raided unchecked — ${stoneTaken} stone + ${woodTaken} wood lost.`,
          "bad",
        );
      }
    },
  },
};

export const ALL_CRISIS_IDS: CrisisId[] = Object.keys(CRISES) as CrisisId[];
