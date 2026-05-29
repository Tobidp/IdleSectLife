// Conditional secrets: hidden achievement-style unlocks earned by player behaviour over
// the course of a run. Different from "achievements" — secrets describe a *playstyle*
// and their tooltips ARE the hint (no checklist; the player discovers them when they
// satisfy the condition).
//
// Triggers live in domain/secrets/secrets.ts; this file is just the data table.

import type { GameState } from "../../state/gameState";

export type SecretId =
  | "iron_survivor"
  | "patient_master"
  | "bloody_path"
  | "great_library"
  | "untouched_year";

export interface SecretDef {
  id: SecretId;
  label: string;
  /** Tooltip / journal entry shown after the secret unlocks. */
  description: string;
  /** Pure check called once per relevant trigger event. Returning true unlocks. */
  isUnlocked(state: GameState): boolean;
}

export const SECRETS: Record<SecretId, SecretDef> = {
  iron_survivor: {
    id: "iron_survivor",
    label: "Iron Survivor",
    description:
      "A disciple of yours walked out of a tribulation at 1 HP. The sect remembers their breath rasp and the silence after.",
    isUnlocked: (s) => Boolean(s.behavior.survivedAt1Hp),
  },
  patient_master: {
    id: "patient_master",
    label: "Patient Master",
    description:
      "An entire in-game year passed without a disciple expelled or lost to abandonment. The hall is steadier for it.",
    isUnlocked: (s) => s.time.totalDays >= 360 && s.behavior.daysSinceLastLoss >= 360,
  },
  bloody_path: {
    id: "bloody_path",
    label: "Bloody Path",
    description:
      "Five tribulations failed. The sect's stelae carry too many names — and the surviving disciples cultivate harder.",
    isUnlocked: (s) => s.behavior.failedTribulations >= 5,
  },
  great_library: {
    id: "great_library",
    label: "Great Library",
    description:
      "Eight different blueprints discovered. Visiting scholars ask to read the shelves.",
    isUnlocked: (s) => s.blueprints.length >= 8,
  },
  untouched_year: {
    id: "untouched_year",
    label: "Untouched Year",
    description:
      "An entire year without a single bandit raid landing on the stores. The roads, briefly, are kind.",
    isUnlocked: (s) => {
      const clock = s.worldClocks.find((c) => c.id === "bandit_threat");
      return s.time.totalDays >= 360 && clock !== undefined && clock.cycles === 0;
    },
  },
};

export const ALL_SECRET_IDS: SecretId[] = Object.keys(SECRETS) as SecretId[];
