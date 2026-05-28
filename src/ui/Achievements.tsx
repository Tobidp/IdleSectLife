// Achievements: a 🏆 footer button shows progress (unlocked/total) and opens a modal listing
// every achievement, its description, and its permanent bonus. Unlocks themselves are surfaced
// as toasts from advanceDay's "Achievement unlocked: …" log entries.

import { useState } from "react";
import { useGameState } from "./engineContext";
import { ACHIEVEMENTS, type AchievementBonus } from "../data/achievements";

function bonusText(b: AchievementBonus): string {
  const parts: string[] = [];
  if (b.collect) parts.push(`+${Math.round(b.collect * 100)}% collection`);
  if (b.fame) parts.push(`+${Math.round(b.fame * 100)}% fame`);
  return parts.join(" · ") || "—";
}

export function Achievements(): JSX.Element | null {
  const state = useGameState();
  const [open, setOpen] = useState(false);
  if (!state) return null;

  const have = new Set(state.achievements);
  const count = state.achievements.length;
  const total = ACHIEVEMENTS.length;

  return (
    <>
      <button className="ach-btn" title="View achievements" onClick={() => setOpen(true)}>
        🏆 {count}/{total}
      </button>
      {open && (
        <div className="modal-overlay" onClick={() => setOpen(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-title">
              Achievements ({count}/{total})
            </div>
            <div className="achievements-list">
              {ACHIEVEMENTS.map((a) => {
                const got = have.has(a.id);
                return (
                  <div key={a.id} className={`achievement ${got ? "got" : "locked"}`}>
                    <div className="achievement-head">
                      <span className="achievement-icon">{got ? "🏆" : "🔒"}</span>
                      <span className="achievement-name">{a.name}</span>
                      <span className="achievement-bonus">{bonusText(a.bonus)}</span>
                    </div>
                    <div className="achievement-desc muted">{a.description}</div>
                  </div>
                );
              })}
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
