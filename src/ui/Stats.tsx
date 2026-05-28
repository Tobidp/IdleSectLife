// Statistics modal: a read-only snapshot of the current run (time, sect, disciples, resources,
// achievements, buildings). Derived live from the game state — no extra counters tracked.

import { useState } from "react";
import { useGameState } from "./engineContext";
import { fmt } from "./components/format";
import { ACHIEVEMENTS } from "../data/achievements";
import { SECT_LABEL } from "../domain/sect/sectTypes";
import { disciplesCapacity } from "../domain/buildings/buildings";

function StatRow({ label, value }: { label: string; value: string }): JSX.Element {
  return (
    <div className="stats-row">
      <span className="stats-label">{label}</span>
      <span className="stats-value">{value}</span>
    </div>
  );
}

export function Stats(): JSX.Element | null {
  const state = useGameState();
  const [open, setOpen] = useState(false);
  if (!state) return null;

  const active = state.disciples.filter((d) => d.status === "active").length;
  const down = state.disciples.length - active;
  const cap = disciplesCapacity(state);

  return (
    <>
      <button className="stats-btn" title="Statistics" onClick={() => setOpen(true)}>
        📊 Stats
      </button>
      {open && (
        <div className="modal-overlay" onClick={() => setOpen(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-title">Statistics</div>
            <div className="stats-list">
              <StatRow
                label="Time"
                value={`Year ${state.time.year}, Month ${state.time.month}, Day ${state.time.day} (${fmt(state.time.totalDays)} total days)`}
              />
              <StatRow label="Sect" value={`${SECT_LABEL[state.sect.type]} · Lv ${state.sect.level}`} />
              <StatRow
                label="Disciples"
                value={`${active} active${down ? ` · ${down} recovering` : ""} · ${state.disciples.length}/${cap}`}
              />
              <StatRow label="Applicants pending" value={String(state.applicants.length)} />
              <StatRow label="Fame" value={fmt(state.fame)} />
              <StatRow label="Gold" value={fmt(state.resources.gold)} />
              <StatRow
                label="Stocks"
                value={`Stone ${fmt(state.resources.stone)} · Wood ${fmt(state.resources.wood)} · Food ${fmt(state.resources.food)} · Cloth ${fmt(state.resources.cloth)}`}
              />
              <StatRow
                label="Buildings"
                value={`Quarters Lv ${state.buildings.quarters.level} · Warehouse Lv ${state.buildings.warehouse.level} · Merchant ${state.buildings.merchant.level === 0 ? "—" : `Lv ${state.buildings.merchant.level}`}`}
              />
              <StatRow
                label="Achievements"
                value={`${state.achievements.length} / ${ACHIEVEMENTS.length}`}
              />
              <StatRow
                label="Gold arrears"
                value={
                  state.goldArrears === 0
                    ? "—"
                    : `${state.goldArrears} month${state.goldArrears === 1 ? "" : "s"}`
                }
              />
            </div>
            <div className="modal-actions">
              <button onClick={() => setOpen(false)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
