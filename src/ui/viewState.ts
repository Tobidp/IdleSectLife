// Transient UI state (not part of the saved game): which tab is open and how the
// disciples roster is being viewed/selected.

export type Tab = "sect" | "disciples";
export type DiscipleSort = "default" | "sect" | "happiness" | "status";

export const DISCIPLE_SORT_LABEL: Record<DiscipleSort, string> = {
  default: "Arrival order",
  sect: "By preferred sect",
  happiness: "By happiness",
  status: "By status",
};

export interface ViewState {
  tab: Tab;
  sort: DiscipleSort;
  selectedIds: Set<number>;
  expandedIds: Set<number>;
  /** Activity chosen in the bulk-action bar, applied to selected disciples. */
  bulkActivity: import("../domain/disciples/disciple").Activity;
}

export function createViewState(): ViewState {
  return {
    tab: "sect",
    sort: "default",
    selectedIds: new Set<number>(),
    expandedIds: new Set<number>(),
    bulkActivity: "train",
  };
}
