// Top summary: sect identity/level, fame, calendar, season, population.

import { Panel } from "../components/Panel";
import { fmt, fmt1 } from "../components/format";
import type { GameState } from "../../state/gameState";
import { SECT_ICON, SECT_LABEL } from "../../domain/sect/sectTypes";
import { currentSeason, formatDate } from "../../core/time/timeEngine";
import { SEASON_ICON, SEASON_LABEL, SEASON_NOTE } from "../../data/seasons";
import { disciplesCapacity } from "../../domain/buildings/buildings";
import { monthlyFameGain, recruitChance } from "../../domain/fame/fame";
import { DOCTRINES } from "../../data/doctrines/doctrineDefs";

function Stat({ label, value, title }: { label: string; value: string; title?: string }): JSX.Element {
  return (
    <div className="stat" title={title}>
      <span className="stat-label">{label}</span>
      <span className="stat-value">{value}</span>
    </div>
  );
}

export function SectOverviewPanel({ state }: { state: GameState }): JSX.Element {
  const season = currentSeason(state.time);
  const cap = disciplesCapacity(state);
  const active = state.disciples.filter((d) => d.status === "active").length;
  const doctrine = state.doctrine ? DOCTRINES[state.doctrine] : null;

  return (
    <Panel title="Sect Overview" className="sect-overview">
      <div className="sect-header">
        <span className="sect-icon">{SECT_ICON[state.sect.type]}</span>
        <div>
          <div className="sect-name">
            {SECT_LABEL[state.sect.type]} · Lv {state.sect.level}
          </div>
          <div className="sect-date">{formatDate(state.time)}</div>
          {doctrine && (
            <div className="sect-doctrine" title={`${doctrine.description}\n+ ${doctrine.bonus}\n− ${doctrine.penalty}`}>
              ◇ {doctrine.label}
            </div>
          )}
        </div>
      </div>
      <div className="stat-grid">
        <Stat label="Fame" value={fmt(state.fame)} title="Drives recruitment and prestige" />
        <Stat
          label="Fame / month"
          value={`+${fmt1(monthlyFameGain(state))}`}
          title="Sect level + happy disciples (paid monthly)"
        />
        <Stat
          label="Season"
          value={`${SEASON_ICON[season]} ${SEASON_LABEL[season]}`}
          title={SEASON_NOTE[season]}
        />
        <Stat label="Disciples" value={`${state.disciples.length} / ${cap}`} title={`${active} active`} />
        <Stat
          label="Recruit chance"
          value={`${Math.round(recruitChance(state.fame) * 100)}% / month`}
          title="Rolled once per month"
        />
      </div>
    </Panel>
  );
}
