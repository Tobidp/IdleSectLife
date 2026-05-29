// One-shot reset of saved dashboard layouts when the layout-lock feature shipped.
//
// Per the UI/UX brief (item 3) the new default is "locked layout"; existing players who
// had customized their panels are reset to the default arrangement on first load after
// the feature ships. The reset runs once, gated by a marker key in localStorage so
// subsequent loads (and any subsequent customization) are left alone.
//
// We DON'T bump the grid storage keys themselves — keeping `idle-sect-life:grid:v3` and
// `idle-sect-life:craft-grid:v1` stable matches the project's "preserve player keys"
// rule and means any code that reads those keys continues to work unchanged.

const MARKER_KEY = "idle-sect-life:layout-lock-reset:v1";
const SECT_GRID_KEY = "idle-sect-life:grid:v3";
const CRAFT_GRID_KEY = "idle-sect-life:craft-grid:v1";

export function migrateLayoutsForLockFeature(): void {
  try {
    if (localStorage.getItem(MARKER_KEY)) return;
    localStorage.removeItem(SECT_GRID_KEY);
    localStorage.removeItem(CRAFT_GRID_KEY);
    localStorage.setItem(MARKER_KEY, "1");
  } catch {
    /* ignore — non-fatal */
  }
}
