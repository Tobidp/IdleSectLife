// Narrative layers attached to each disciple. Origin, ambition and fear are rolled at
// creation; trauma and destiny start unset and are stamped on later by personal events
// (B3) and end-of-life recognition (E-series).
//
// Personal-event content in B3 branches on these ids, so they're the contract between
// the data table and the event system — add an entry here and B3 events can reference it.

export type OriginId =
  | "orphan"
  | "noble_born"
  | "peasant"
  | "ex_bandit"
  | "merchant_child"
  | "wandering_healer"
  | "fallen_aristocrat"
  | "monastery_foundling";

export type AmbitionId =
  | "glory"
  | "peace"
  | "vengeance"
  | "wealth"
  | "enlightenment"
  | "longevity"
  | "knowledge"
  | "family_honor";

export type FearId =
  | "failing_tribulation"
  | "growing_old"
  | "losing_rival"
  | "betrayal"
  | "poverty"
  | "abandonment"
  | "oblivion"
  | "weakness";

export type DestinyId =
  | "elder"
  | "traitor"
  | "hero"
  | "martyr"
  | "lineage_founder"
  | "recluse"
  | "ascendant";

export interface NarrativeLayer<Id extends string> {
  id: Id;
  label: string;
  description: string;
}

export const ORIGINS: Record<OriginId, NarrativeLayer<OriginId>> = {
  orphan: { id: "orphan", label: "Orphan", description: "Raised without name or family; the sect is the only home they remember." },
  noble_born: { id: "noble_born", label: "Noble-born", description: "Heir of a forgotten house — accustomed to expectation, suspicious of equals." },
  peasant: { id: "peasant", label: "Peasant", description: "Tilled fields before they tilled their inner qi. Patient, hands-on, often underestimated." },
  ex_bandit: { id: "ex_bandit", label: "Ex-bandit", description: "Once they took what they wanted by force. Walked into the sect to bury the past." },
  merchant_child: { id: "merchant_child", label: "Merchant's child", description: "Counts coins and favors faster than they breathe. Knows what every road is worth." },
  wandering_healer: { id: "wandering_healer", label: "Wandering healer", description: "Treated villagers across the countryside before finding the path. Knows pain by touch." },
  fallen_aristocrat: { id: "fallen_aristocrat", label: "Fallen aristocrat", description: "A name that opened doors — until it didn't. Bitter, well-read, watching." },
  monastery_foundling: { id: "monastery_foundling", label: "Monastery foundling", description: "Left at a temple door. Equally at ease with scripture and silence." },
};

export const AMBITIONS: Record<AmbitionId, NarrativeLayer<AmbitionId>> = {
  glory: { id: "glory", label: "Seeks glory", description: "Wants their name shouted at tournaments and carved into stelae." },
  peace: { id: "peace", label: "Seeks peace", description: "Cultivates so that no one will ever again disturb their stillness." },
  vengeance: { id: "vengeance", label: "Seeks vengeance", description: "There is a name. There is a debt. Power is the currency." },
  wealth: { id: "wealth", label: "Seeks wealth", description: "Treats every breakthrough as another stone in a private fortune." },
  enlightenment: { id: "enlightenment", label: "Seeks enlightenment", description: "Pursues the path itself, not what the path can buy." },
  longevity: { id: "longevity", label: "Seeks longevity", description: "Death is the only enemy that matters. Every year is currency." },
  knowledge: { id: "knowledge", label: "Seeks knowledge", description: "Manuals, relics, forgotten doctrines — they want to read it all." },
  family_honor: { id: "family_honor", label: "Restores family honor", description: "An ancestor was wronged. A name was stained. They will scrub it clean." },
};

export const FEARS: Record<FearId, NarrativeLayer<FearId>> = {
  failing_tribulation: { id: "failing_tribulation", label: "Fears failing tribulation", description: "The thought of breaking on the threshold of a breakthrough haunts them." },
  growing_old: { id: "growing_old", label: "Fears growing old", description: "Every grey hair is an accusation; every ache, a warning." },
  losing_rival: { id: "losing_rival", label: "Fears losing to their rival", description: "There is a face. Being second to it would be a small death." },
  betrayal: { id: "betrayal", label: "Fears betrayal", description: "Trust is rationed. Friends are kept at arm's length." },
  poverty: { id: "poverty", label: "Fears poverty", description: "They have been hungry before. Never again, whatever it costs." },
  abandonment: { id: "abandonment", label: "Fears abandonment", description: "Will work twice as hard, complain half as much — anything to be kept around." },
  oblivion: { id: "oblivion", label: "Fears oblivion", description: "The thought of dying unremembered is worse than dying." },
  weakness: { id: "weakness", label: "Fears weakness", description: "Reads softness in themselves as a moral failing. Pushes too hard." },
};

export const DESTINIES: Record<DestinyId, NarrativeLayer<DestinyId>> = {
  elder: { id: "elder", label: "Destined for elder rank", description: "Walked their final years as a pillar of the sect." },
  traitor: { id: "traitor", label: "Destined to betray", description: "When the moment came, they chose another path — and the sect remembered." },
  hero: { id: "hero", label: "Destined for heroism", description: "A defining act of courage when the sect needed it most." },
  martyr: { id: "martyr", label: "Destined for martyrdom", description: "Spent their life so the sect could keep walking forward." },
  lineage_founder: { id: "lineage_founder", label: "Founder of a lineage", description: "Their teachings echo through generations of disciples after them." },
  recluse: { id: "recluse", label: "Withdrew to seclusion", description: "Left the affairs of the sect to chase a stiller path." },
  ascendant: { id: "ascendant", label: "Ascended", description: "Reached a height few of their generation will see." },
};

const ORIGIN_IDS = Object.keys(ORIGINS) as OriginId[];
const AMBITION_IDS = Object.keys(AMBITIONS) as AmbitionId[];
const FEAR_IDS = Object.keys(FEARS) as FearId[];

import type { Rng } from "../../core/rng/rng";

export function rollOrigin(rng: Rng): OriginId {
  return rng.pick(ORIGIN_IDS);
}

export function rollAmbition(rng: Rng): AmbitionId {
  return rng.pick(AMBITION_IDS);
}

export function rollFear(rng: Rng): FearId {
  return rng.pick(FEAR_IDS);
}
