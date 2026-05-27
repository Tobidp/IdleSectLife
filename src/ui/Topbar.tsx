// Header bar: brand, tab navigation, and the time controls.

import type { GameState } from "../state/gameState";
import { useView, useViewDispatch, type Tab } from "./viewContext";
import { TimeControls } from "./TimeControls";
import { STORY_ENABLED } from "../config/featureFlags";

function TabButton({
  tab,
  label,
  alert = false,
  disabled = false,
}: {
  tab: Tab;
  label: string;
  alert?: boolean;
  disabled?: boolean;
}): JSX.Element {
  const view = useView();
  const dispatch = useViewDispatch();
  return (
    <button
      className={`tab-btn ${view.tab === tab ? "active" : ""}`.trim()}
      disabled={disabled}
      title={disabled ? "Coming soon" : undefined}
      onClick={() => !disabled && dispatch({ type: "setTab", tab })}
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
        <TabButton tab="disciples" label={`Disciples (${state.disciples.length})`} />
        <TabButton
          tab="story"
          label="Story"
          alert={state.narrative.pendingEncounters.length > 0}
          disabled={!STORY_ENABLED}
        />
      </nav>
      <TimeControls state={state} />
    </header>
  );
}
