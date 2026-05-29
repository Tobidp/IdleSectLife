// Cultivation techniques disciples can learn. Each technique re-shapes the disciple's
// growth profile — per-attribute XP multipliers, max HP, breakthrough fail chance — and
// can lock out specific other techniques (conflicts) or require state on the sect
// (doctrines, building levels). Combining techniques is the "build" axis.
//
// Effects default to 1.0 / no-op, so a technique only mentions what it changes.

import type { Attribute } from "../../domain/sect/sectTypes";
import type { DoctrineId } from "../doctrines/doctrineDefs";

export type TechniqueId =
  | "serene_sword"
  | "bloody_sword"
  | "iron_body"
  | "inner_qi"
  | "hidden_needles";

export interface TechniqueDef {
  id: TechniqueId;
  name: string;
  description: string;
  /** Plain-English line shown in the picker before commit. */
  bonus: string;
  penalty: string;
  /** Other techniques on the same disciple block this one. */
  conflicts: TechniqueId[];
  /** Sect-level prerequisites (apply to the whole sect, not the disciple). */
  requiresDoctrine?: DoctrineId;
  requiresSectLevel?: number;
  /** Effects on the disciple. All default to 1.0; provide only the deltas. */
  xpMult?: Partial<Record<Attribute, number>>;
  maxHpMult?: number;
  /** <1.0 = easier breakthroughs, >1.0 = harder. Stacks multiplicatively across techs. */
  breakthroughFailMult?: number;
}

export const TECHNIQUES: Record<TechniqueId, TechniqueDef> = {
  serene_sword: {
    id: "serene_sword",
    name: "Manual of the Serene Sword",
    description:
      "Strike like falling rain. Precision over impact — the duelist's path of small openings.",
    bonus: "+30% dexterity XP · easier breakthroughs",
    penalty: "−15% strength XP · conflicts with Bloody Sword",
    conflicts: ["bloody_sword"],
    xpMult: { dexterity: 1.3, strength: 0.85 },
    breakthroughFailMult: 0.92,
  },
  bloody_sword: {
    id: "bloody_sword",
    name: "Manual of the Bloody Sword",
    description:
      "The blade that doesn't hesitate. Crushing power earned at the cost of stamina and mood.",
    bonus: "+30% strength XP · much easier breakthroughs",
    penalty: "−15% vitality XP · conflicts with Serene Sword · requires Supremacy doctrine",
    conflicts: ["serene_sword"],
    requiresDoctrine: "supremacy",
    xpMult: { strength: 1.3, vitality: 0.85 },
    breakthroughFailMult: 0.85,
  },
  iron_body: {
    id: "iron_body",
    name: "Scripture of the Iron Body",
    description:
      "Bury the spirit deep in the bones. A disciple who walks off wounds others cannot.",
    bonus: "+30% vitality XP · +20% max HP",
    penalty: "−20% dexterity XP · conflicts with Inner Qi Canon",
    conflicts: ["inner_qi"],
    xpMult: { vitality: 1.3, dexterity: 0.8 },
    maxHpMult: 1.2,
  },
  inner_qi: {
    id: "inner_qi",
    name: "Canon of the Inner Qi",
    description:
      "Quiet the body so the spirit can listen. Slow growth at first; vast reserves later.",
    bonus: "+25% health XP · +10% dexterity XP · easier breakthroughs",
    penalty: "−20% vitality XP · conflicts with Iron Body · requires sect level 3",
    conflicts: ["iron_body"],
    requiresSectLevel: 3,
    xpMult: { health: 1.25, dexterity: 1.1, vitality: 0.8 },
    breakthroughFailMult: 0.9,
  },
  hidden_needles: {
    id: "hidden_needles",
    name: "Technique of the Hidden Needles",
    description:
      "Sleight, poison, the seam between two breaths. The sect does not boast of those who study it.",
    bonus: "+25% dexterity XP · +10% strength XP",
    penalty: "no fame burst on this disciple's rank-ups · requires Shadow doctrine",
    conflicts: [],
    requiresDoctrine: "shadow",
    xpMult: { dexterity: 1.25, strength: 1.1 },
  },
};

export const ALL_TECHNIQUE_IDS: TechniqueId[] = Object.keys(TECHNIQUES) as TechniqueId[];
