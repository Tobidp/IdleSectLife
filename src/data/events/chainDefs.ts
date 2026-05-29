// Event chains: multi-stage narrative arcs that unfold across the player's choices. Each
// stage is a text + choice list; a choice can transition to another stage (the chain
// stays active) or end the chain (no transitionTo). Choices apply effects in-place via
// their apply() function, just like personal events.
//
// Chains differ from personal events in that they have STATE between presentations — a
// choice on day 5 changes what shows up on day 12. Used for moral dilemmas where the
// real point is the second-order consequence, not the immediate +/-.

import type { GameState } from "../../state/gameState";
import type { Rng } from "../../core/rng/rng";
import { pushLog } from "../../state/log";

export type ChainId = "sealed_cave";

export interface ChainChoice {
  id: string;
  label: string;
  /** Short consequence preview shown next to the label. */
  preview: string;
  /** Next stage id; pass null to end the chain (mark completed). */
  transitionTo: string | null;
  apply(state: GameState, rng: Rng): void;
}

export interface ChainStage {
  id: string;
  text: string;
  choices: readonly ChainChoice[];
}

export interface ChainDef {
  id: ChainId;
  title: string;
  /** Daily chance the chain spawns (if not already active or completed). */
  dailyTriggerChance: number;
  /** Eligibility filter beyond the daily roll — for example, must have N disciples. */
  canTrigger(state: GameState): boolean;
  startStage: string;
  stages: Record<string, ChainStage>;
}

const sealed_cave: ChainDef = {
  id: "sealed_cave",
  title: "The sealed cave",
  dailyTriggerChance: 0.006,
  canTrigger: (state) =>
    state.disciples.length >= 2 && state.time.totalDays >= 20,
  startStage: "discover",
  stages: {
    discover: {
      id: "discover",
      text: "A disciple returns from the cold ridge with strange news: a cave mouth, half-buried, sealed with an old talisman they don't recognise. The wind that comes out smells of incense.",
      choices: [
        {
          id: "break_seal",
          label: "Break the seal now and explore",
          preview: "→ next stage now · risk waking what's inside",
          transitionTo: "inside",
          apply: (state) => {
            pushLog(state, "Your scouts crack the talisman and slip into the cave.", "info");
          },
        },
        {
          id: "report_elders",
          label: "Report it to the elders first",
          preview: "→ next stage after deliberation · safer",
          transitionTo: "inside",
          apply: (state) => {
            pushLog(
              state,
              "The elders deliberate for days before authorising entry. Better prepared, but the rumour spreads.",
              "info",
            );
          },
        },
        {
          id: "leave_alone",
          label: "Reseal it and leave the ridge",
          preview: "− 4 fame · chain ends · no risk",
          transitionTo: null,
          apply: (state) => {
            state.fame = Math.max(0, state.fame - 4);
            pushLog(
              state,
              "The cave is resealed. Whatever was inside stays there. A small loss of face for not investigating.",
              "info",
            );
          },
        },
      ],
    },
    inside: {
      id: "inside",
      text: "Inside the cave: a skeleton in cultivator's robes, a brass mirror cracked down the middle, and a small wooden chest. The air shifts when you step too close to the chest.",
      choices: [
        {
          id: "take_chest",
          label: "Open the chest",
          preview: "+ 80 gold · + 1 fame · trauma on a disciple",
          transitionTo: "aftermath_taken",
          apply: (state, rng) => {
            state.resources.gold += 80;
            state.fame += 1;
            // Stamp trauma on a random active disciple.
            const eligible = state.disciples.filter((d) => d.status === "active" && !d.trauma);
            if (eligible.length > 0) {
              const victim = rng.pick(eligible);
              victim.trauma = "haunted by the cave seal";
              pushLog(
                state,
                `Inside: 80 gold of old coin. ${victim.name} has not slept the night through since.`,
                "info",
              );
            } else {
              pushLog(state, "Inside: 80 gold of old coin and a long quiet.", "info");
            }
          },
        },
        {
          id: "burn_offering",
          label: "Burn an offering and bury the skeleton",
          preview: "− 6 herb · + 6 fame · honor restored",
          transitionTo: "aftermath_honor",
          apply: (state) => {
            state.resources.herb = Math.max(0, state.resources.herb - 6);
            state.fame += 6;
            pushLog(
              state,
              "Incense burns over the cave mouth. The wind quiets. The sect's reputation grows.",
              "good",
            );
          },
        },
        {
          id: "back_away",
          label: "Back out and reseal",
          preview: "chain ends · no effect",
          transitionTo: null,
          apply: (state) => {
            pushLog(state, "Your scouts retreat. The cave is sealed again, deeper this time.", "info");
          },
        },
      ],
    },
    aftermath_taken: {
      id: "aftermath_taken",
      text: "Weeks later, a traveler arrives at the gate — a hooded woman who claims to be from the lineage of the cultivator you disturbed. She demands the gold back.",
      choices: [
        {
          id: "return",
          label: "Return the gold and apologise",
          preview: "− 80 gold · + 8 fame · chain ends well",
          transitionTo: null,
          apply: (state) => {
            state.resources.gold = Math.max(0, state.resources.gold - 80);
            state.fame += 8;
            pushLog(
              state,
              "The gold is returned. The woman bows and leaves. Word spreads of a sect that knows when to make amends.",
              "good",
            );
          },
        },
        {
          id: "refuse",
          label: "Refuse — the cave was no one's",
          preview: "+ bandit_threat progress · chain ends with bad blood",
          transitionTo: null,
          apply: (state) => {
            const clock = state.worldClocks.find((c) => c.id === "bandit_threat");
            if (clock) clock.progress = Math.min(45, clock.progress + 25);
            pushLog(
              state,
              "She leaves silent. Rumours of outlaws on the trade road thicken in the following weeks.",
              "bad",
            );
          },
        },
      ],
    },
    aftermath_honor: {
      id: "aftermath_honor",
      text: "Months later, a wandering hermit arrives, having heard of the honour shown at the cave. He stays one night, leaves a folded note: a recipe for a pill no one in your sect knows yet.",
      choices: [
        {
          id: "accept_recipe",
          label: "Study the recipe",
          preview: "+ 12 herb · + 3 fame · chain ends",
          transitionTo: null,
          apply: (state) => {
            state.resources.herb += 12;
            state.fame += 3;
            pushLog(
              state,
              "The recipe yields nothing immediately, but the alchemists have something new to study.",
              "good",
            );
          },
        },
      ],
    },
  },
};

export const ALL_CHAINS: readonly ChainDef[] = [sealed_cave];

export function getChainDef(id: ChainId): ChainDef | undefined {
  return ALL_CHAINS.find((c) => c.id === id);
}
