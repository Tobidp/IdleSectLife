// One-time "welcome back" notice summarizing offline progress accrued on this boot.

import { useState } from "react";
import { useEngine } from "./engineContext";
import { fmt } from "./components/format";

function signed(n: number, label: string): string {
  return `${n > 0 ? "+" : "−"}${fmt(Math.abs(n))} ${label}`;
}

export function WelcomeBack(): JSX.Element | null {
  const engine = useEngine();
  const [summary] = useState(() => engine.getOfflineSummary());
  const [dismissed, setDismissed] = useState(false);

  if (!summary || dismissed) return null;

  const gains: string[] = [];
  if (summary.fame) gains.push(signed(summary.fame, "fame"));
  if (summary.gold) gains.push(signed(summary.gold, "gold"));
  if (summary.disciples) gains.push(signed(summary.disciples, "disciples"));

  return (
    <div className="modal-overlay" onClick={() => setDismissed(true)}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-title">Welcome back</div>
        <p className="modal-text">
          The sect carried on for about {summary.days} day{summary.days === 1 ? "" : "s"} while you
          were away (at a reduced pace).
        </p>
        {gains.length > 0 && <p className="welcome-gains">{gains.join(" · ")}</p>}
        <div className="modal-actions">
          <button className="primary" onClick={() => setDismissed(true)}>
            Continue
          </button>
        </div>
      </div>
    </div>
  );
}
