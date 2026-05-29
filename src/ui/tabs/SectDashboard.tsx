// Sect dashboard: the five panels as a draggable + resizable React Grid Layout. RGL provides
// the magnetism (snapping to the 12-column grid); Motion adds smooth entrance + settle. Drag
// by the panel title bar; resize from the bottom-right corner. Layout persists to localStorage.
//
// Panels unfold with progression — `visiblePanels(state, PANEL_IDS)` filters out anything not
// yet earned. The layout array fed to RGL is filtered to match the rendered children so its
// internal child<->layout map stays consistent.

import { useCallback, useMemo, useState } from "react";
import GridLayout, { WidthProvider, type Layout } from "react-grid-layout";
import { motion } from "motion/react";
import type { GameState } from "../../state/gameState";
import { SectOverviewPanel } from "../panels/SectOverviewPanel";
import { ResourcesPanel } from "../panels/ResourcesPanel";
import { BuildingsPanel } from "../panels/BuildingsPanel";
import { MarketPanel } from "../panels/MarketPanel";
import { WorldStatusPanel } from "../panels/WorldStatusPanel";
import { MissionsPanel } from "../missions/MissionsPanel";
import { RivalsPanel } from "../rivals/RivalsPanel";
import { TerritoriesPanel } from "../territories/TerritoriesPanel";
import { EventLogPanel } from "../panels/EventLogPanel";
import {
  GRID_COLS,
  GRID_ROW_HEIGHT,
  GRID_MARGIN,
  PANEL_IDS,
  type PanelId,
  loadGridLayout,
  saveGridLayout,
  resetGridLayout,
  defaultLayout,
} from "../windows/gridLayout";
import { visiblePanels } from "../progression/visibility";
import { usePrefs, useSetPrefs } from "../prefsContext";

const Grid = WidthProvider(GridLayout);

export function SectDashboard({ state }: { state: GameState }): JSX.Element {
  const [layout, setLayout] = useState<Layout[]>(() => loadGridLayout());
  const prefs = usePrefs();
  const setPrefs = useSetPrefs();
  const customizable = prefs.customizeLayout;

  const onLayoutChange = useCallback((next: Layout[]) => {
    setLayout(next);
    saveGridLayout(next);
  }, []);

  const reset = useCallback(() => {
    resetGridLayout();
    setLayout(defaultLayout());
  }, []);

  const visible = useMemo(() => visiblePanels(state, PANEL_IDS), [state]);
  const visibleSet = useMemo(() => new Set(visible), [visible]);
  const displayedLayout = useMemo(
    () => layout.filter((it) => visibleSet.has(it.i as PanelId)),
    [layout, visibleSet],
  );

  const panels: Record<PanelId, JSX.Element> = {
    overview: <SectOverviewPanel state={state} />,
    resources: <ResourcesPanel state={state} />,
    buildings: <BuildingsPanel state={state} />,
    market: <MarketPanel state={state} />,
    world: <WorldStatusPanel state={state} />,
    missions: <MissionsPanel state={state} />,
    rivals: <RivalsPanel state={state} />,
    territories: <TerritoriesPanel state={state} />,
    log: <EventLogPanel state={state} />,
  };

  return (
    <div className="windows-wrap">
      <Grid
        className="layout-grid"
        layout={displayedLayout}
        cols={GRID_COLS}
        rowHeight={GRID_ROW_HEIGHT}
        margin={GRID_MARGIN}
        draggableHandle=".panel-title"
        onLayoutChange={onLayoutChange}
        isDraggable={customizable}
        isResizable={customizable}
        compactType="vertical"
        useCSSTransforms
      >
        {visible.map((id) => (
          <div key={id}>
            <motion.div
              className="grid-window"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: "spring", stiffness: 420, damping: 32 }}
            >
              {panels[id]}
            </motion.div>
          </div>
        ))}
      </Grid>
      <div className="windows-toolbar">
        {customizable && (
          <span className="muted">
            Drag a panel by its title bar; resize from the corner. Windows snap to the grid.
          </span>
        )}
        {customizable && (
          <button className="reset-layout" onClick={reset}>
            Reset layout
          </button>
        )}
        <button
          className="customize-btn"
          onClick={() => setPrefs({ ...prefs, customizeLayout: !customizable })}
        >
          {customizable ? "Lock layout" : "Customize layout"}
        </button>
      </div>
    </div>
  );
}
