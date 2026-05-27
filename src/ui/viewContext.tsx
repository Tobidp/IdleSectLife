// Transient UI state (not saved): which tab is open, the disciples roster's
// selection/expansion/sort, the bulk activity, and the open investigation. Managed with a
// reducer and shared via context.

import { createContext, useContext, useReducer, type Dispatch, type ReactNode } from "react";
import type { Activity } from "../domain/disciples/disciple";
import type { InvestigationId } from "../domain/narrative/types";

export type Tab = "sect" | "disciples" | "story";
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
  bulkActivity: Activity;
  openInvestigationId: InvestigationId | null;
}

export type ViewAction =
  | { type: "setTab"; tab: Tab }
  | { type: "setSort"; sort: DiscipleSort }
  | { type: "toggleSelected"; id: number }
  | { type: "setSelected"; ids: number[] }
  | { type: "toggleExpanded"; id: number }
  | { type: "setBulkActivity"; activity: Activity }
  | { type: "openInvestigation"; id: InvestigationId | null };

function reducer(state: ViewState, action: ViewAction): ViewState {
  switch (action.type) {
    case "setTab":
      return { ...state, tab: action.tab };
    case "setSort":
      return { ...state, sort: action.sort };
    case "toggleSelected": {
      const selectedIds = new Set(state.selectedIds);
      if (selectedIds.has(action.id)) selectedIds.delete(action.id);
      else selectedIds.add(action.id);
      return { ...state, selectedIds };
    }
    case "setSelected":
      return { ...state, selectedIds: new Set(action.ids) };
    case "toggleExpanded": {
      const expandedIds = new Set(state.expandedIds);
      if (expandedIds.has(action.id)) expandedIds.delete(action.id);
      else expandedIds.add(action.id);
      return { ...state, expandedIds };
    }
    case "setBulkActivity":
      return { ...state, bulkActivity: action.activity };
    case "openInvestigation":
      return { ...state, openInvestigationId: action.id };
    default:
      return state;
  }
}

const INITIAL: ViewState = {
  tab: "sect",
  sort: "default",
  selectedIds: new Set<number>(),
  expandedIds: new Set<number>(),
  bulkActivity: "train",
  openInvestigationId: null,
};

const ViewContext = createContext<{ view: ViewState; dispatch: Dispatch<ViewAction> } | null>(
  null,
);

export function ViewProvider({ children }: { children: ReactNode }): JSX.Element {
  const [view, dispatch] = useReducer(reducer, INITIAL);
  return <ViewContext.Provider value={{ view, dispatch }}>{children}</ViewContext.Provider>;
}

export function useView(): ViewState {
  const ctx = useContext(ViewContext);
  if (!ctx) throw new Error("useView must be used within a ViewProvider");
  return ctx.view;
}

export function useViewDispatch(): Dispatch<ViewAction> {
  const ctx = useContext(ViewContext);
  if (!ctx) throw new Error("useViewDispatch must be used within a ViewProvider");
  return ctx.dispatch;
}
