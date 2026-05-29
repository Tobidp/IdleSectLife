// Doctrines: a one-time, run-permanent choice that re-shapes the sect's identity. Each
// doctrine carries a `mult` table (multiplicative effects, default 1.0) that domain
// systems consult via doctrineMult(). Picking is gated by sect level so the player has
// played long enough to feel the tradeoff matter.
//
// Effect ids are the contract between this table and the systems that consult it (see
// domain/doctrines/effects.ts). Adding a new effect: define it on DoctrineEffectId, wire
// the consumer in its system, and the doctrines that should change it can list it here.

export type DoctrineId =
  | "harmony"
  | "supremacy"
  | "mercantile"
  | "ascetic"
  | "shadow"
  | "medicinal";

export type DoctrineEffectId =
  | "happinessGainMult"
  | "trainingXpMult"
  | "breakthroughSuccessMult"
  | "marketSellPriceMult"
  | "fameBurstMult"
  | "missionGoldMult"
  | "infirmaryHealMult"
  | "blueprintDropMult";

export interface DoctrineDef {
  id: DoctrineId;
  label: string;
  description: string;
  /** Plain-English summary shown in the picker before commit. */
  bonus: string;
  penalty: string;
  /** Multiplicative effects vs default of 1.0. */
  mult: Partial<Record<DoctrineEffectId, number>>;
}

export const DOCTRINES: Record<DoctrineId, DoctrineDef> = {
  harmony: {
    id: "harmony",
    label: "Doctrine of Harmony",
    description:
      "Cultivate stillness. Disciples thrive together; the sect grows in friendships and steady mood, slower in raw power.",
    bonus: "+25% happiness gain · +25% infirmary heal",
    penalty: "−20% training XP",
    mult: { happinessGainMult: 1.25, infirmaryHealMult: 1.25, trainingXpMult: 0.8 },
  },
  supremacy: {
    id: "supremacy",
    label: "Doctrine of Supremacy",
    description:
      "Strength is the only argument. Disciples push past their fear of tribulation, but the courtyard grows colder.",
    bonus: "+25% breakthrough success · +15% fame burst on rank-ups",
    penalty: "−20% happiness gain",
    mult: { breakthroughSuccessMult: 1.25, fameBurstMult: 1.15, happinessGainMult: 0.8 },
  },
  mercantile: {
    id: "mercantile",
    label: "Doctrine of Commerce",
    description:
      "Every coin tells a story. The sect's name doesn't carry as far, but its coffers do.",
    bonus: "+35% market sell prices · +25% mission gold",
    penalty: "−25% fame burst on rank-ups",
    mult: { marketSellPriceMult: 1.35, missionGoldMult: 1.25, fameBurstMult: 0.75 },
  },
  ascetic: {
    id: "ascetic",
    label: "Doctrine of Ascesis",
    description:
      "Empty the mind, fill the bones. Training is everything; trade and worldly missions are a distraction.",
    bonus: "+35% training XP",
    penalty: "−40% mission gold · −20% market sell prices",
    mult: { trainingXpMult: 1.35, missionGoldMult: 0.6, marketSellPriceMult: 0.8 },
  },
  shadow: {
    id: "shadow",
    label: "Doctrine of the Shadow",
    description:
      "Forbidden techniques, scattered relics. The sect rewards the sharp blade and the silent step — but envoys watch.",
    bonus: "+40% blueprint drop · +15% mission gold",
    penalty: "−15% happiness gain · −15% fame burst on rank-ups",
    mult: {
      blueprintDropMult: 1.4,
      missionGoldMult: 1.15,
      happinessGainMult: 0.85,
      fameBurstMult: 0.85,
    },
  },
  medicinal: {
    id: "medicinal",
    label: "Doctrine of Medicine",
    description:
      "Healers first, warriors second. The sect's reputation as a haven grows; its strikes do not.",
    bonus: "+50% infirmary heal · +15% happiness gain",
    penalty: "−15% breakthrough success",
    mult: { infirmaryHealMult: 1.5, happinessGainMult: 1.15, breakthroughSuccessMult: 0.85 },
  },
};

export const ALL_DOCTRINE_IDS: DoctrineId[] = Object.keys(DOCTRINES) as DoctrineId[];
