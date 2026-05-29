// Cross-run history modal: pulls the legacy storage records (legacy + ending + date)
// and shows them as a timeline. Survives hard reset because legacies live in their own
// localStorage key, not in the per-run save.

import { useEffect, useState } from "react";
import { loadLegacyStorage, type LegacyHistoryEntry } from "../../domain/legacies/legacyStorage";
import { LEGACIES } from "../../data/legacies/legacyDefs";
import { ENDINGS } from "../../data/endings/endingDefs";

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString();
  } catch {
    return iso;
  }
}

export function HistoryButton(): JSX.Element {
  const [open, setOpen] = useState(false);
  const [records, setRecords] = useState<LegacyHistoryEntry[]>([]);
  // Refresh when opened so a freshly concluded run shows up immediately.
  useEffect(() => {
    if (!open) return;
    setRecords(loadLegacyStorage().records);
  }, [open]);

  return (
    <>
      <button className="history-btn" title="Legacy record across runs" onClick={() => setOpen(true)}>
        📜 History
      </button>
      {open && (
        <div className="modal-overlay" onClick={() => setOpen(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-title">Legacy Record</div>
            {records.length === 0 ? (
              <p className="muted">No runs concluded yet. Conclude a run to record its legacy.</p>
            ) : (
              <div className="history-list">
                {records.slice().reverse().map((r, i) => {
                  const legacy = LEGACIES[r.legacy];
                  const ending = ENDINGS[r.ending];
                  return (
                    <div className="history-entry" key={i}>
                      <div className="history-date muted">{formatDate(r.concludedAt)}</div>
                      <div className="history-ending">{ending?.label ?? r.ending}</div>
                      <div className="history-legacy muted">{legacy?.label ?? r.legacy}</div>
                      {ending && <div className="history-desc muted">{ending.description}</div>}
                    </div>
                  );
                })}
              </div>
            )}
            <div className="modal-actions">
              <button onClick={() => setOpen(false)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
