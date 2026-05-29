// Header bar: brand, tab navigation, and the time controls. Tabs unfold as the player
// satisfies their unlock conditions — `isTabVisible(state, tab)` returns false until the
// surface has been earned, and the button isn't rendered at all in that case.

import type { GameState } from "../state/gameState";
import { useView, useViewDispatch, type Tab } from "./viewContext";
import { TimeControls } from "./TimeControls";
import { isTabVisible } from "./progression/visibility";

function TabButton({
  tab,
  label,
  alert = false,
}: {
  tab: Tab;
  label: string;
  alert?: boolean;
}): JSX.Element {
  const view = useView();
  const dispatch = useViewDispatch();
  return (
    <button
      className={`tab-btn ${view.tab === tab ? "active" : ""}`.trim()}
      onClick={() => dispatch({ type: "setTab", tab })}
    >
      <span>{label}</span>
      {alert && <span className="tab-alert" title="Something needs your attention" />}
    </button>
  );
}

export function Topbar({ state }: { state: GameState }): JSX.Element {
  return (
    <header className="topbar">
      <span className="brand">Sect: Ascendant</span>
      <nav className="tabs">
        <TabButton tab="sect" label="Sect" />
        {isTabVisible(state, "disciples") && (
          <TabButton tab="disciples" label={`Disciples (${state.disciples.length})`} />
        )}
        {isTabVisible(state, "craft") && <TabButton tab="craft" label="Craft" />}
        {isTabVisible(state, "story") && (
          <TabButton
            tab="story"
            label="Story"
            alert={state.narrative.pendingEncounters.length > 0}
          />
        )}
      </nav>
      <TimeControls state={state} />
    </header>
  );
}
