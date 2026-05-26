// Daily action metadata and helpers.

import type { Activity } from "./disciple";
import type { CollectableResource } from "../resources/resourceTypes";

/** Order shown in the per-slot picker. */
export const ACTIVITY_OPTIONS: readonly Activity[] = [
  "collect_stone",
  "collect_wood",
  "collect_food",
  "train",
  "idle",
];

export const ACTIVITY_LABEL: Record<Activity, string> = {
  collect_stone: "Collect Stone",
  collect_wood: "Collect Wood",
  collect_food: "Collect Food",
  train: "Train",
  idle: "Idle",
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
    default:
      return null;
  }
}
