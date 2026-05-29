// World Status panel: shows the external pressures that advance each day. Each clock has
// a progress bar (progress/threshold), a severity dot, and a tooltip describing what fires
// when it fills. Lives in the Sect dashboard's grid; hidden until day 7 (panel.world).

import { Panel } from "../components/Panel";
import type { GameState } from "../../state/gameState";
import { CLOCK_DEFS, type ClockSeverity } from "../../domain/world/clockDefs";
import { CRISES } from "../../data/crises/crisisDefs";

const SEVERITY_LABEL: Record<ClockSeverity, string> = {
  low: "low risk",
  medium: "medium risk",
  high: "high risk",
};

function ClockRow({
  id,
  progress,
  cycles,
}: {
  id: string;
  progress: number;
  cycles: number;
}): JSX.Element | null {
  const def = CLOCK_DEFS[id as keyof typeof CLOCK_DEFS];
  if (!def) return null;
  const pct = Math.min(100, Math.round((progress / def.threshold) * 100));
  const remaining = Math.max(0, def.threshold - progress);
  const ariaLabel = `${def.name}: ${pct}% (${remaining} days until next event, ${SEVERITY_LABEL[def.severity]})`;
  return (
    <div className="clock-row" title={def.description} aria-label={ariaLabel}>
      <div className="clock-head">
        <span className={`clock-dot clock-${def.severity}`} aria-hidden="true" />
        <span className="clock-name">{def.name}</span>
        <span className="clock-meta muted">
          {remaining}d
          {cycles > 0 && ` · cycle ${cycles + 1}`}
        </span>
      </div>
      <div className="clock-bar" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct}>
        <div className={`clock-bar-fill clock-${def.severity}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export function WorldStatusPanel({ state }: { state: GameState }): JSX.Element {
  return (
    <Panel title="World Status" className="world-status">
      {state.scheduledCrises.length > 0 && (
        <div className="crisis-list">
          {state.scheduledCrises.map((sc) => {
            const def = CRISES[sc.defId];
            if (!def) return null;
            const daysAway = Math.max(0, sc.scheduledFor - state.time.totalDays);
            return (
              <div className="crisis-card" key={sc.defId} title={def.announcement}>
                <div className="crisis-head">
                  <span className="crisis-name">⚠ {def.name}</span>
                  <span className="crisis-eta muted">{daysAway}d</span>
                </div>
                <div className="crisis-desc muted">{def.announcement}</div>
              </div>
            );
          })}
        </div>
      )}
      {state.worldClocks.length === 0 ? (
        <p className="muted">The world is quiet for now.</p>
      ) : (
        <div className="clock-list">
          {state.worldClocks.map((c) => (
            <ClockRow key={c.id} id={c.id} progress={c.progress} cycles={c.cycles} />
          ))}
        </div>
      )}
    </Panel>
  );
}
