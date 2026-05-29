// Personal events: per-disciple narrative beats triggered by their identity layers
// (ambition / fear / trait / origin / status). Each event carries 2–3 choices with
// concrete preview text so the player can weigh the trade.
//
// Adding an event: define it here, add its id to `PersonalEventId`, push it to the
// ALL_PERSONAL_EVENTS array, and the trigger system in domain/disciples/personalEvents.ts
// will surface it whenever canFire() is true for some disciple.

import type { GameState } from "../../state/gameState";
import type { Disciple } from "../../domain/disciples/disciple";
import type { Rng } from "../../core/rng/rng";
import { pushLog } from "../../state/log";
import { effectiveLevel } from "../../domain/disciples/attributes";

export type PersonalEventId =
  | "brooding_after_injury"
  | "glory_duel_request"
  | "tribulation_doubt"
  | "orphan_visitor"
  | "hotheaded_brawl";

export interface PersonalEventChoice {
  id: string;
  label: string;
  /** Short consequence preview so the player can decide before clicking. */
  preview: string;
  apply(state: GameState, disciple: Disciple, rng: Rng): void;
}

export interface PersonalEventDef {
  id: PersonalEventId;
  title(d: Disciple): string;
  text(d: Disciple): string;
  /** Filter: is this event eligible for this disciple in this state right now? */
  canFire(state: GameState, d: Disciple): boolean;
  choices: readonly PersonalEventChoice[];
}

// --- Shared helpers ---

function adjustHappiness(d: Disciple, delta: number): void {
  d.happiness = Math.max(0, Math.min(100, d.happiness + delta));
}

function adjustHp(d: Disciple, delta: number): void {
  d.hp = Math.max(0, d.hp + delta);
}

function markTrauma(d: Disciple, trauma: string): void {
  if (!d.trauma) d.trauma = trauma;
}

// --- Event defs ---

const brooding_after_injury: PersonalEventDef = {
  id: "brooding_after_injury",
  title: (d) => `${d.name} broods over a recent failure`,
  text: (d) =>
    `${d.name} has been quiet since the last setback. They sit alone after duties, replaying the moment in their head. Word among the bonded disciples is they're considering leaving the sect.`,
  canFire: (state, d) => d.happiness <= 60 && d.status === "active" && state.disciples.length >= 2,
  choices: [
    {
      id: "isolate",
      label: "Send them to train alone in the mountains",
      preview: "+ attribute xp · - 15 happiness · risk of trauma",
      apply: (state, d, rng) => {
        adjustHappiness(d, -15);
        d.attributes.strength.xp += 30;
        d.attributes.vitality.xp += 30;
        if (rng.chance(0.3)) {
          markTrauma(d, "scarred by isolation");
          pushLog(state, `${d.name} returned from solitude colder than before.`, "bad");
        } else {
          pushLog(state, `${d.name} returned hardened by the mountain wind.`, "info");
        }
      },
    },
    {
      id: "mentor",
      label: "Pair them with an experienced mentor",
      preview: "+ 15 happiness · costs one senior disciple's day",
      apply: (state, d, _rng) => {
        adjustHappiness(d, 15);
        pushLog(state, `An elder takes ${d.name} aside; the brooding eases.`, "good");
      },
    },
    {
      id: "ignore",
      label: "Leave them to work it out",
      preview: "no immediate effect · risk of abandonment later",
      apply: (state, d, rng) => {
        if (rng.chance(0.4)) {
          adjustHappiness(d, -10);
          pushLog(state, `${d.name}'s mood worsens after being left alone.`, "bad");
        } else {
          pushLog(state, `${d.name} works through it in their own time.`, "info");
        }
      },
    },
  ],
};

const glory_duel_request: PersonalEventDef = {
  id: "glory_duel_request",
  title: (d) => `${d.name} requests permission to duel`,
  text: (d) =>
    `${d.name} has caught wind of a traveling swordsman challenging cultivators across the valley. They ask leave to test their name against his.`,
  canFire: (_state, d) =>
    d.ambition === "glory" && d.status === "active" && effectiveLevel(d.attributes.strength) >= 5,
  choices: [
    {
      id: "allow",
      label: "Allow the duel",
      preview: "chance: + 8 fame · or - HP and trauma",
      apply: (state, d, rng) => {
        const skill = effectiveLevel(d.attributes.strength) + effectiveLevel(d.attributes.dexterity);
        const wins = rng.chance(Math.min(0.85, 0.4 + skill * 0.02));
        if (wins) {
          state.fame += 8;
          adjustHappiness(d, 10);
          pushLog(state, `${d.name} wins the duel — the sect's name spreads (+8 fame).`, "good");
        } else {
          adjustHp(d, -15);
          markTrauma(d, "defeated in the duel valley");
          pushLog(state, `${d.name} returned defeated and silent.`, "bad");
        }
      },
    },
    {
      id: "refuse",
      label: "Refuse — the timing is wrong",
      preview: "- 8 happiness · no risk",
      apply: (state, d, _rng) => {
        adjustHappiness(d, -8);
        pushLog(state, `${d.name} accepts the refusal but the gleam in their eye dims.`, "info");
      },
    },
  ],
};

const tribulation_doubt: PersonalEventDef = {
  id: "tribulation_doubt",
  title: (d) => `${d.name} doubts their next breakthrough`,
  text: (d) =>
    `${d.name} wakes with sweat on their brow. They confess to an elder they fear the next tribulation. The dread is sharpening their reflexes — and stalling them at the threshold.`,
  canFire: (_state, d) =>
    d.fear === "failing_tribulation" && d.status === "active" && effectiveLevel(d.attributes.strength) >= 9,
  choices: [
    {
      id: "reassure",
      label: "Sit with them through the doubt",
      preview: "+ 12 happiness · Tribulation Aid applied (if any)",
      apply: (state, d, _rng) => {
        adjustHappiness(d, 12);
        if ((state.pills.tribulationAid ?? 0) > 0) {
          state.pills.tribulationAid = (state.pills.tribulationAid ?? 0) - 1;
          d.tribulationBuff = true;
          pushLog(state, `An elder steadies ${d.name}; Tribulation Aid is applied.`, "good");
        } else {
          pushLog(state, `${d.name} regains composure after the night.`, "info");
        }
      },
    },
    {
      id: "harden",
      label: "Drive them harder",
      preview: "+ xp · risk of trauma · - happiness",
      apply: (state, d, rng) => {
        adjustHappiness(d, -10);
        d.attributes.strength.xp += 50;
        if (rng.chance(0.5)) {
          markTrauma(d, "broken by tribulation drill");
          pushLog(state, `The drill broke something in ${d.name}.`, "bad");
        }
      },
    },
  ],
};

const orphan_visitor: PersonalEventDef = {
  id: "orphan_visitor",
  title: (d) => `An old woman asks for ${d.name}`,
  text: (d) =>
    `An old woman from a distant village arrives at the sect gate asking for ${d.name}. She knew their mother. She has brought a small wooden carving.`,
  canFire: (_state, d) => d.origin === "orphan" && d.status === "active",
  choices: [
    {
      id: "welcome",
      label: "Welcome her as an honored guest",
      preview: "+ 20 happiness · small gold cost",
      apply: (state, d, _rng) => {
        adjustHappiness(d, 20);
        state.resources.gold = Math.max(0, state.resources.gold - 5);
        pushLog(state, `${d.name} sits with the visitor for hours. Their step is lighter for days.`, "good");
      },
    },
    {
      id: "turn_away",
      label: "Turn her away — the sect must focus",
      preview: "- 15 happiness · trauma stamp",
      apply: (state, d, _rng) => {
        adjustHappiness(d, -15);
        markTrauma(d, "turned away the messenger");
        pushLog(state, `${d.name} watched the visitor walk away from the gate. They have not spoken since.`, "bad");
      },
    },
  ],
};

const hotheaded_brawl: PersonalEventDef = {
  id: "hotheaded_brawl",
  title: (d) => `${d.name} started a brawl in town`,
  text: (d) =>
    `Word arrives that ${d.name} traded blows with a local guard over an insult. No one is dead. The merchants want recompense; the magistrate wants discipline.`,
  canFire: (state, d) => d.trait === "hotheaded" && d.status === "active" && state.resources.gold >= 10,
  choices: [
    {
      id: "pay",
      label: "Pay the reparations and apologize",
      preview: "- 10 gold · + 5 happiness · no fame loss",
      apply: (state, d, _rng) => {
        state.resources.gold = Math.max(0, state.resources.gold - 10);
        adjustHappiness(d, 5);
        pushLog(state, `Reparations smoothed over the incident — the merchants are placated.`, "info");
      },
    },
    {
      id: "discipline",
      label: "Discipline them publicly",
      preview: "- 15 happiness · + 4 fame · others learn",
      apply: (state, d, _rng) => {
        adjustHappiness(d, -15);
        state.fame += 4;
        pushLog(state, `${d.name} was disciplined in the courtyard. The other disciples watched in silence.`, "info");
      },
    },
    {
      id: "ignore",
      label: "Defend them — they were provoked",
      preview: "- 6 fame · + 10 happiness · risk diplomatic fallout",
      apply: (state, d, _rng) => {
        state.fame = Math.max(0, state.fame - 6);
        adjustHappiness(d, 10);
        pushLog(state, `The sect stood behind ${d.name}. The magistrate is not amused.`, "bad");
      },
    },
  ],
};

export const ALL_PERSONAL_EVENTS: readonly PersonalEventDef[] = [
  brooding_after_injury,
  glory_duel_request,
  tribulation_doubt,
  orphan_visitor,
  hotheaded_brawl,
];

export function getPersonalEventDef(id: PersonalEventId): PersonalEventDef | undefined {
  return ALL_PERSONAL_EVENTS.find((e) => e.id === id);
}
