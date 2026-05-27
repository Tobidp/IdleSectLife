// Centered "a new version is available" overlay, shown when a newer deploy is detected.

import { useEffect, useState } from "react";
import { startUpdateCheck } from "../core/version/updateCheck";

export function UpdateBanner(): JSX.Element | null {
  const [available, setAvailable] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => startUpdateCheck(() => setAvailable(true)), []);

  if (!available || dismissed) return null;

  return (
    <div className="update-overlay">
      <div className="update-modal">
        <div className="update-title">New version available</div>
        <p className="update-text">
          A new version of IdleSectLife has been released. Refresh the page to play the latest
          version.
        </p>
        <div className="update-actions">
          <button className="update-refresh" onClick={() => window.location.reload()}>
            Refresh now
          </button>
          <button className="update-later" onClick={() => setDismissed(true)}>
            Later
          </button>
        </div>
      </div>
    </div>
  );
}
