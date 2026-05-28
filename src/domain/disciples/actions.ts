// Daily action metadata and helpers.

import type { Activity } from "./disciple";
import type { CollectableResource } from "../resources/resourceTypes";
import type { PavilionKey } from "../buildings/buildings";

/** Order shown in the per-slot picker. Grouped via ACTIVITY_GROUP in the UI optgroups. */
export const ACTIVITY_OPTIONS: readonly Activity[] = [
  "collect_stone",
  "collect_wood",
  "collect_food",
  "collect_ore",
  "train",
  "idle",
  "work_forge",
  "work_herbGarden",
  "work_alchemyLab",
  "work_trainingHall",
  "work_infirmary",
  "work_merchant",
];

export const ACTIVITY_LABEL: Record<Activity, string> = {
  collect_stone: "Collect Stone",
  collect_wood: "Collect Wood",
  collect_food: "Collect Food",
  collect_ore: "Collect Ore",
  train: "Train",
  idle: "Idle",
  work_forge: "Work · Forge",
  work_herbGarden: "Work · Herb Garden",
  work_alchemyLab: "Work · Alchemy Lab",
  work_trainingHall: "Work · Training Hall",
  work_infirmary: "Work · Infirmary",
  work_merchant: "Work · Merchant",
};

/** Used by the UI to split the dropdown into optgroups. */
export type ActivityGroup = "collect" | "study" | "work";
export const ACTIVITY_GROUP: Record<Activity, ActivityGroup> = {
  collect_stone: "collect",
  collect_wood: "collect",
  collect_food: "collect",
  collect_ore: "collect",
  train: "study",
  idle: "study",
  work_forge: "work",
  work_herbGarden: "work",
  work_alchemyLab: "work",
  work_trainingHall: "work",
  work_infirmary: "work",
  work_merchant: "work",
};
export const ACTIVITY_GROUP_LABEL: Record<ActivityGroup, string> = {
  collect: "Collect",
  study: "Cultivation",
  work: "Work",
};

/** The resource a collect-action gathers, or null for non-collect activities. */
export function collectResourceOf(activity: Activity): CollectableResource | null {
  switch (activity) {
    case "collect_stone":
      return "stone";
    case "collect_wood":
      return "wood";
    case "collect_food":
      return "food";
    case "collect_ore":
      return "ore";
    default:
      return null;
  }
}

/** The pavilion a "work_*" action targets, or null for non-job activities. */
export function jobBuildingOf(activity: Activity): PavilionKey | null {
  switch (activity) {
    case "work_forge":
      return "forge";
    case "work_herbGarden":
      return "herbGarden";
    case "work_alchemyLab":
      return "alchemyLab";
    case "work_trainingHall":
      return "trainingHall";
    case "work_infirmary":
      return "infirmary";
    case "work_merchant":
      return "merchant";
    default:
      return null;
  }
}
