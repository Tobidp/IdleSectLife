// Craft tab: Alchemy + Forge crafting and a shared Bag, arranged as draggable + resizable
// windows (same React Grid Layout pattern as the Sect dashboard, separate persisted layout).

import { useCallback, useMemo, useState } from "react";
import GridLayout, { WidthProvider, type Layout } from "react-grid-layout";
import { motion } from "motion/react";
import type { GameState } from "../../state/gameState";
import { AlchemyPanel } from "../Alchemy";
import { ForgePanel } from "../Forge";
import { BagPanel } from "../Bag";
import {
  CRAFT_GRID_COLS,
  CRAFT_GRID_ROW_HEIGHT,
  CRAFT_GRID_MARGIN,
  CRAFT_PANEL_IDS,
  type CraftPanelId,
  loadCraftLayout,
  saveCraftLayout,
  resetCraftLayout,
  defaultCraftLayout,
} from "../windows/craftGridLayout";
import { visibleCraftPanels } from "../progression/visibility";

const Grid = WidthProvider(GridLayout);

export function CraftView({ state }: { state: GameState }): JSX.Element {
  const [layout, setLayout] = useState<Layout[]>(() => loadCraftLayout());

  const onLayoutChange = useCallback((next: Layout[]) => {
    setLayout(next);
    saveCraftLayout(next);
  }, []);

  const reset = useCallback(() => {
    resetCraftLayout();
    setLayout(defaultCraftLayout());
  }, []);

  const visible = useMemo(() => visibleCraftPanels(state, CRAFT_PANEL_IDS), [state]);
  const visibleSet = useMemo(() => new Set(visible), [visible]);
  const displayedLayout = useMemo(
    () => layout.filter((it) => visibleSet.has(it.i as CraftPanelId)),
    [layout, visibleSet],
  );

  const panels: Record<CraftPanelId, JSX.Element> = {
    alchemy: <AlchemyPanel />,
    forge: <ForgePanel />,
    bag: <BagPanel />,
  };

  return (
    <div className="windows-wrap">
      <Grid
        className="layout-grid"
        layout={displayedLayout}
        cols={CRAFT_GRID_COLS}
        rowHeight={CRAFT_GRID_ROW_HEIGHT}
        margin={CRAFT_GRID_MARGIN}
        draggableHandle=".panel-title"
        onLayoutChange={onLayoutChange}
        isResizable
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
        <span className="muted">
          Drag a panel by its title bar; resize from the corner. Windows snap to the grid.
        </span>
        <button className="reset-layout" onClick={reset}>
          Reset layout
        </button>
      </div>
    </div>
  );
}
