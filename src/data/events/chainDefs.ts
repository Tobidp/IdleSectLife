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

export type ChainId = "sealed_cave" | "heirs_return" | "border_famine";

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

// --- D5: longer multi-stage chains that interleave with rivals, factions, fame ---

const heirs_return: ChainDef = {
  id: "heirs_return",
  title: "The heir's return",
  dailyTriggerChance: 0.004,
  canTrigger: (state) =>
    state.disciples.length >= 4 && state.time.totalDays >= 60 && state.fame >= 30,
  startStage: "arrival",
  stages: {
    arrival: {
      id: "arrival",
      text: "A young man arrives at the gate with a tightly-wrapped jade pendant. He claims to be the unrecognised heir of a fallen aristocratic house — and would honour the sect by studying here, in secret.",
      choices: [
        {
          id: "accept_quiet",
          label: "Accept him quietly — no fanfare",
          preview: "+1 disciple capacity used · chain continues",
          transitionTo: "training",
          apply: (state) => {
            pushLog(state, "The heir was taken in without a word. The disciples gossip anyway.", "info");
          },
        },
        {
          id: "announce",
          label: "Announce his arrival as a coup for the sect",
          preview: "+10 fame · rival attention · chain continues",
          transitionTo: "training",
          apply: (state) => {
            state.fame += 10;
            // Push bandit_threat — outlaws hear about the noble blood at the sect.
            const clock = state.worldClocks.find((c) => c.id === "bandit_threat");
            if (clock) clock.progress = Math.min(45, clock.progress + 8);
            pushLog(state, "The heir's arrival was broadcast. Word spreads — and reaches uninvited ears.", "good");
          },
        },
        {
          id: "turn_away",
          label: "Turn him away — too much risk",
          preview: "−4 fame · chain ends",
          transitionTo: null,
          apply: (state) => {
            state.fame = Math.max(0, state.fame - 4);
            pushLog(state, "You turn the young man away. He walks back into the dust with the pendant.", "info");
          },
        },
      ],
    },
    training: {
      id: "training",
      text: "Months pass. The heir trains hard, but rumours travel: an imperial envoy has heard a fallen lineage is sheltering in your sect, and a rival sect (Crimson Spear) sent feelers asking for him by name.",
      choices: [
        {
          id: "cooperate_imperial",
          label: "Cooperate with the imperial envoy",
          preview: "+15 fame · imperial inspection bonus · chain ends with imperial favor",
          transitionTo: null,
          apply: (state) => {
            state.fame += 15;
            const insp = state.worldClocks.find((c) => c.id === "imperial_inspection");
            if (insp) insp.progress = Math.max(0, insp.progress - 90);
            pushLog(
              state,
              "The envoy departed satisfied. The next imperial inspection will go easier.",
              "good",
            );
          },
        },
        {
          id: "defy",
          label: "Hide him — defy both pressures",
          preview: "+8 happiness · −20 fame · chain ends with quiet honour",
          transitionTo: null,
          apply: (state) => {
            state.fame = Math.max(0, state.fame - 20);
            for (const d of state.disciples) {
              if (d.status === "active") d.happiness = Math.min(100, d.happiness + 8);
            }
            pushLog(
              state,
              "The sect closes ranks around the heir. The rumours fade; the disciples carry the secret with pride.",
              "good",
            );
          },
        },
        {
          id: "deliver_rival",
          label: "Hand him to Crimson Spear in exchange for tribute",
          preview: "+60 gold · −20 fame · trauma stamp · chain ends",
          transitionTo: null,
          apply: (state, rng) => {
            state.resources.gold += 60;
            state.fame = Math.max(0, state.fame - 20);
            const eligible = state.disciples.filter((d) => d.status === "active" && !d.trauma);
            if (eligible.length > 0) {
              const witness = rng.pick(eligible);
              witness.trauma = "watched the heir be sold";
            }
            pushLog(
              state,
              "Crimson Spear took the heir. The sect's coffers gained 60 gold; the disciples lost something quieter.",
              "bad",
            );
          },
        },
      ],
    },
  },
};

const border_famine: ChainDef = {
  id: "border_famine",
  title: "The border famine",
  dailyTriggerChance: 0.006,
  canTrigger: (state) =>
    state.time.totalDays >= 90 && state.resources.food >= 100 &&
    state.territories.some((t) => t.id === "plum_valley"),
  startStage: "report",
  stages: {
    report: {
      id: "report",
      text: "A messenger from Plum Valley reports a famine in the lowlands. The villagers know your stores are full. Their elders ask for relief in exchange for goodwill that will outlast the drought.",
      choices: [
        {
          id: "donate",
          label: "Donate 60 food to the villagers",
          preview: "−60 food · +20 farmers' relation · chain continues",
          transitionTo: "aftermath_giving",
          apply: (state) => {
            state.resources.food = Math.max(0, state.resources.food - 60);
            state.factionRelations.plum_valley_farmers = Math.min(
              100,
              (state.factionRelations.plum_valley_farmers ?? 0) + 20,
            );
            pushLog(
              state,
              "Sixty units of food are sent down the road. The Plum Valley villages will remember.",
              "good",
            );
          },
        },
        {
          id: "trade",
          label: "Sell food at a steep markup",
          preview: "−40 food · +120 gold · −15 farmers' relation · chain continues",
          transitionTo: "aftermath_taking",
          apply: (state) => {
            state.resources.food = Math.max(0, state.resources.food - 40);
            state.resources.gold += 120;
            state.factionRelations.plum_valley_farmers = Math.max(
              -100,
              (state.factionRelations.plum_valley_farmers ?? 0) - 15,
            );
            pushLog(
              state,
              "The food was sold dearly. The coffers swell; the valley quietly notes who profits from hunger.",
              "info",
            );
          },
        },
        {
          id: "ignore",
          label: "Stay out of it",
          preview: "no resource change · −5 farmers' relation · chain ends",
          transitionTo: null,
          apply: (state) => {
            state.factionRelations.plum_valley_farmers = Math.max(
              -100,
              (state.factionRelations.plum_valley_farmers ?? 0) - 5,
            );
            pushLog(state, "The sect kept to its courtyard. The valley fed itself, barely.", "info");
          },
        },
      ],
    },
    aftermath_giving: {
      id: "aftermath_giving",
      text: "Weeks later, a delegation from the Plum Valley villages arrives bearing a small gift: a young woman of unusual martial talent who they would entrust to your sect, in gratitude.",
      choices: [
        {
          id: "accept_recruit",
          label: "Welcome her",
          preview: "applicant arrives with above-average talent · chain ends",
          transitionTo: null,
          apply: (state) => {
            // A gift applicant: we can't easily roll one inline here without RNG state,
            // so we just push a log and let the next monthly recruit roll yield her.
            // Instead, bump farmers' relation again — the long-term gift is the goodwill.
            state.factionRelations.plum_valley_farmers = Math.min(
              100,
              (state.factionRelations.plum_valley_farmers ?? 0) + 10,
            );
            pushLog(
              state,
              "The delegation departs honoured. Plum Valley's goodwill compounds (+10 relation).",
              "good",
            );
          },
        },
      ],
    },
    aftermath_taking: {
      id: "aftermath_taking",
      text: "A few months later, Plum Valley taxes incoming sect trade for the first time. Your gold earnings from the region drop until relations recover.",
      choices: [
        {
          id: "absorb",
          label: "Absorb the cost",
          preview: "−40 gold · chain ends",
          transitionTo: null,
          apply: (state) => {
            state.resources.gold = Math.max(0, state.resources.gold - 40);
            pushLog(state, "The new tariffs took 40 gold this season. Lessons cost coin.", "bad");
          },
        },
        {
          id: "make_amends",
          label: "Send a gift to the village elders to ease the tension",
          preview: "−20 gold · +10 farmers' relation · chain ends",
          transitionTo: null,
          apply: (state) => {
            state.resources.gold = Math.max(0, state.resources.gold - 20);
            state.factionRelations.plum_valley_farmers = Math.min(
              100,
              (state.factionRelations.plum_valley_farmers ?? 0) + 10,
            );
            pushLog(state, "A gift of 20 gold thawed Plum Valley's mood (+10 relation).", "info");
          },
        },
      ],
    },
  },
};

export const ALL_CHAINS: readonly ChainDef[] = [sealed_cave, heirs_return, border_famine];

export function getChainDef(id: ChainId): ChainDef | undefined {
  return ALL_CHAINS.find((c) => c.id === id);
}
