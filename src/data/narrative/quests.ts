// Quest content database (PLACEHOLDER). A quest becomes available when `available` is true
// (or always, if omitted); the player accepts it, and it can be completed once `objectiveMet`
// returns true. Rewards are applied on completion.

import type { GameState } from "../../state/gameState";
import type { ResourceType } from "../../domain/resources/resourceTypes";

export interface QuestReward {
  fame?: number;
  resources?: Partial<Record<ResourceType, number>>;
}

export interface QuestData {
  title: string;
  description: string;
  reward: QuestReward;
  /** When present, the quest only appears once this returns true. */
  available?: (game: GameState) => boolean;
  /** The quest can be completed once this returns true. */
  objectiveMet: (game: GameState) => boolean;
}

export const QUEST_DATABASE: Record<string, QuestData> = {
  first_disciples: {
    title: "[PLACEHOLDER] Gather Your First Disciples",
    description: "[PLACEHOLDER] A sect is nothing without people. Grow to 5 disciples.",
    reward: { fame: 25 },
    objectiveMet: (game) => game.disciples.length >= 5,
  },
  seek_chen: {
    title: "[PLACEHOLDER] Seek Out Mestre Chen",
    description: "[PLACEHOLDER] The old cultivator knows what really happened. Speak with him.",
    reward: { fame: 10, resources: { food: 20 } },
    available: (game) => game.sect.level >= 2,
    objectiveMet: (game) => game.narrative.flags.met_chen === true,
  },
};
