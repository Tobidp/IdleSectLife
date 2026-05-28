// Per-device settings modal. Currently a single toggle (notifications); a natural place to
// grow with more UI preferences over time.

import { useState } from "react";
import { usePrefs, useSetPrefs } from "./prefsContext";

export function Settings(): JSX.Element {
  const prefs = usePrefs();
  const setPrefs = useSetPrefs();
  const [open, setOpen] = useState(false);

  return (
    <>
      <button className="settings-btn" title="Settings" onClick={() => setOpen(true)}>
        ⚙ Settings
      </button>
      {open && (
        <div className="modal-overlay" onClick={() => setOpen(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-title">Settings</div>
            <label className="setting-row">
              <input
                type="checkbox"
                checked={prefs.notifications}
                onChange={(e) => setPrefs({ ...prefs, notifications: e.target.checked })}
              />
              <span>Show notifications (toasts)</span>
            </label>
            <div className="modal-actions">
              <button onClick={() => setOpen(false)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
