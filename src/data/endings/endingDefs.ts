// Endings recognised when a player concludes a run. Each ending has a qualifier function
// that scores the state; the highest-scoring qualifier is presented on the conclude modal
// as the run's title. Ties broken by definition order.
//
// Endings are descriptive (no carry mechanic of their own — the carry is the legacy the
// player picks alongside).

import type { GameState } from "../../state/gameState";

export type EndingId =
  | "imperial_sect"
  | "demonic_sect"
  | "medicinal_sect"
  | "mercantile_sect"
  | "ascetic_sect"
  | "militarist_sect"
  | "broken_sect"
  | "guardian_sect"
  | "errant_sect";

export interface EndingDef {
  id: EndingId;
  label: string;
  description: string;
  /** Returns a score (any non-negative number) for how well the state matches this
   *  ending. Highest score wins. Returning 0 disqualifies. */
  score(state: GameState): number;
}

export const ENDINGS: Record<EndingId, EndingDef> = {
  imperial_sect: {
    id: "imperial_sect",
    label: "The Imperial Sect",
    description:
      "Recognised at court. The envoys speak well of you in the capital, and rivals walk softly around the gate.",
    score: (s) => {
      const inspection = s.worldClocks.find((c) => c.id === "imperial_inspection");
      const passed = (inspection?.cycles ?? 0) > 0 ? 20 : 0;
      return s.fame >= 200 ? s.fame * 0.1 + passed : 0;
    },
  },
  demonic_sect: {
    id: "demonic_sect",
    label: "The Demonic Sect",
    description:
      "The sect chose the sharp blade and the silent step. Few welcome you now; fewer dare cross you.",
    score: (s) => {
      const traumaCount = s.disciples.filter((d) => d.trauma).length;
      const shadowDoctrine = s.doctrine === "shadow" ? 50 : 0;
      return shadowDoctrine + traumaCount * 10;
    },
  },
  medicinal_sect: {
    id: "medicinal_sect",
    label: "The Healing Sect",
    description:
      "Villages across the valley owe you their lives. Your name is a comfort spoken in dark rooms.",
    score: (s) => {
      const medDoctrine = s.doctrine === "medicinal" ? 60 : 0;
      return medDoctrine + s.buildings.infirmary.level * 10;
    },
  },
  mercantile_sect: {
    id: "mercantile_sect",
    label: "The Merchant Sect",
    description:
      "Coin built every hall. The trade roads bear your seal; rivals borrow from you to make war.",
    score: (s) => {
      const merchantDoctrine = s.doctrine === "mercantile" ? 50 : 0;
      return merchantDoctrine + s.resources.gold * 0.05;
    },
  },
  ascetic_sect: {
    id: "ascetic_sect",
    label: "The Ascetic Sect",
    description:
      "The world is rumour; the path is the only road. The strongest disciples meditate while empires fall.",
    score: (s) => {
      const ascDoctrine = s.doctrine === "ascetic" ? 60 : 0;
      const tribulations = s.disciples.reduce((n, d) => n + Math.max(0, d.attributes.strength.rank - 1), 0);
      return ascDoctrine + tribulations * 5;
    },
  },
  militarist_sect: {
    id: "militarist_sect",
    label: "The Militarist Sect",
    description:
      "Steel before silk. Tournaments fall to your disciples; rivals send envoys rather than scouts.",
    score: (s) => {
      const supremacy = s.doctrine === "supremacy" ? 50 : 0;
      const tournaments = s.lastTournamentDay !== null ? 20 : 0;
      const fame = s.fame * 0.05;
      return supremacy + tournaments + fame;
    },
  },
  broken_sect: {
    id: "broken_sect",
    label: "The Fractured Sect",
    description:
      "The first generation grew fast and broke faster. The records list more names than the courtyard remembers.",
    score: (s) => s.behavior.failedTribulations * 8,
  },
  guardian_sect: {
    id: "guardian_sect",
    label: "The Guardian Sect",
    description:
      "You held the valley quietly. No empire, no enemies — but every village trusts the next generation.",
    score: (s) => {
      const noLoss = s.behavior.daysSinceLastLoss >= 360 ? 50 : 0;
      const factionGood = Object.values(s.factionRelations).reduce(
        (sum, v) => sum + (v > 0 ? v : 0),
        0,
      );
      return noLoss + factionGood * 0.5;
    },
  },
  errant_sect: {
    id: "errant_sect",
    label: "The Errant Sect",
    description:
      "Your halls were a waystation. The disciples carried the manuals into the world and never quite came back.",
    score: (s) => {
      // Few buildings, many missions / discoveries.
      const buildingsScore = 30 - Math.min(30, (s.buildings.quarters.level + s.buildings.warehouse.level) * 3);
      const blueprints = s.blueprints.length * 4;
      return buildingsScore + blueprints;
    },
  },
};

export const ALL_ENDING_IDS: EndingId[] = Object.keys(ENDINGS) as EndingId[];

/** Compute the best-fit ending for the current state (highest score, ties → first). */
export function computeEnding(state: GameState): EndingId {
  let best: EndingId = "errant_sect";
  let bestScore = -1;
  for (const id of ALL_ENDING_IDS) {
    const s = ENDINGS[id].score(state);
    if (s > bestScore) {
      bestScore = s;
      best = id;
    }
  }
  return best;
}
