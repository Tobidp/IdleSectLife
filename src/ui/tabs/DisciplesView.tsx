// Disciples tab: a management toolbar (selection, bulk actions, sort, presets) over a
// compact, expandable roster grouped by the chosen sort, plus the pending-applicants section.

import { Panel } from "../components/Panel";
import { fmt } from "../components/format";
import type { GameState } from "../../state/gameState";
import { useActions } from "../engineContext";
import type { SlotTarget } from "../../core/engine";
import { useView, useViewDispatch, DISCIPLE_SORT_LABEL, type DiscipleSort } from "../viewContext";
import { maxHp, type Activity, type Disciple } from "../../domain/disciples/disciple";
import { progressFraction, type AttrProgress } from "../../domain/disciples/attributes";
import { ACTIVITY_LABEL, ACTIVITY_OPTIONS } from "../../domain/disciples/actions";
import { disciplesCapacity } from "../../domain/buildings/buildings";
import {
  ATTRIBUTE_LABEL,
  SECT_ICON,
  SECT_ATTRIBUTE,
  type Attribute,
} from "../../domain/sect/sectTypes";
import { STARS_PER_RANK, rankName, rankTierClass } from "../../data/progression";
import { orderedDisciples, groupKey, groupLabel } from "./discipleOrder";

const ATTR_ORDER: Attribute[] = ["health", "strength", "dexterity", "vitality"];
const SLOT_LABELS = ["Morning", "Afternoon", "Night"];
const PRESETS: { label: string; activity: Activity }[] = [
  { label: "All Train", activity: "train" },
  { label: "All Food", activity: "collect_food" },
  { label: "All Wood", activity: "collect_wood" },
  { label: "All Stone", activity: "collect_stone" },
];

function happinessClass(h: number): string {
  if (h >= 75) return "happy";
  if (h >= 50) return "mid";
  return "unhappy";
}

function AttrRow({ a, attr, isSectAttr }: { a: AttrProgress; attr: Attribute; isSectAttr: boolean }): JSX.Element {
  const stars = "★".repeat(a.star) + "☆".repeat(STARS_PER_RANK - a.star);
  const pct = Math.round(progressFraction(a) * 100);
  return (
    <div
      className={`attr-row ${rankTierClass(a.rank)} ${isSectAttr ? "is-sect-attr" : ""}`.trim()}
      title={`${ATTRIBUTE_LABEL[attr]} — ${rankName(a.rank)} · ${a.star}/${STARS_PER_RANK}★ · ${pct}% to next`}
    >
      <span className="attr-name">{ATTRIBUTE_LABEL[attr]}</span>
      <span className="attr-rank">{rankName(a.rank)}</span>
      <span className="attr-stars">{stars}</span>
      <div className="attr-xp">
        <div className="attr-xp-fill" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function DiscipleRow({ state, d }: { state: GameState; d: Disciple }): JSX.Element {
  const actions = useActions();
  const view = useView();
  const dispatch = useViewDispatch();
  const sectAttr = SECT_ATTRIBUTE[state.sect.type];
  const down = d.status === "down";
  const selected = view.selectedIds.has(d.id);
  const expanded = view.expandedIds.has(d.id);

  return (
    <div className={`d-row ${down ? "is-down" : ""} ${selected ? "sel" : ""}`.trim()}>
      <div className="d-head">
        <input
          type="checkbox"
          className="d-check"
          checked={selected}
          onChange={() => dispatch({ type: "toggleSelected", id: d.id })}
        />
        <button
          className="d-expand"
          title="Show attributes"
          onClick={() => dispatch({ type: "toggleExpanded", id: d.id })}
        >
          {expanded ? "▾" : "▸"}
        </button>
        <span className="d-sect" title={`Prefers ${d.preferredSect}`}>
          {SECT_ICON[d.preferredSect]}
        </span>
        <span className="d-name">{d.name}</span>
        <span className={`d-joy ${happinessClass(d.happiness)}`} title="Happiness">
          ♥ {fmt(d.happiness)}
        </span>
        <span className="d-hp" title="HP">
          {fmt(d.hp)}/{fmt(maxHp(d))}
        </span>
        {down ? (
          <span className="badge badge-down">Recovering</span>
        ) : (
          <div className="d-actions">
            {[0, 1, 2].map((slot) => (
              <select
                key={slot}
                className="action-select"
                title={SLOT_LABELS[slot]}
                value={d.actions[slot]}
                onChange={(e) => actions.setDiscipleAction(d.id, slot, e.target.value as Activity)}
              >
                {ACTIVITY_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {ACTIVITY_LABEL[opt]}
                  </option>
                ))}
              </select>
            ))}
          </div>
        )}
      </div>
      {expanded && (
        <div className="d-attrs">
          {ATTR_ORDER.map((attr) => (
            <AttrRow key={attr} a={d.attributes[attr]} attr={attr} isSectAttr={attr === sectAttr} />
          ))}
        </div>
      )}
    </div>
  );
}

function Toolbar({ state }: { state: GameState }): JSX.Element {
  const actions = useActions();
  const view = useView();
  const dispatch = useViewDispatch();
  const total = state.disciples.length;
  const selectedCount = state.disciples.filter((d) => view.selectedIds.has(d.id)).length;
  const noneSelected = selectedCount === 0;

  const selectPortion = (fraction: number): void => {
    if (fraction <= 0) {
      dispatch({ type: "setSelected", ids: [] });
      return;
    }
    const ordered = orderedDisciples(state, view.sort);
    const count = Math.ceil(fraction * ordered.length);
    dispatch({ type: "setSelected", ids: ordered.slice(0, count).map((d) => d.id) });
  };

  const selectedIds = (): number[] => state.disciples.filter((d) => view.selectedIds.has(d.id)).map((d) => d.id);

  const slots: { label: string; target: SlotTarget }[] = [
    { label: "Morning", target: 0 },
    { label: "Afternoon", target: 1 },
    { label: "Night", target: 2 },
    { label: "All 3", target: "all" },
  ];

  return (
    <div className="disciples-toolbar">
      <div className="tool-row">
        <span className="tool-label">Select:</span>
        {[0.25, 0.5, 0.75, 1].map((f) => (
          <button key={f} onClick={() => selectPortion(f)}>
            {f * 100}%
          </button>
        ))}
        <button onClick={() => selectPortion(0)}>None</button>
        <span className="tool-count">
          {selectedCount} / {total} selected
        </span>
      </div>

      <div className="tool-row">
        <span className="tool-label">Set selected →</span>
        <select
          className="bulk-activity"
          title="Activity to apply"
          value={view.bulkActivity}
          onChange={(e) => dispatch({ type: "setBulkActivity", activity: e.target.value as Activity })}
        >
          {ACTIVITY_OPTIONS.map((opt) => (
            <option key={opt} value={opt}>
              {ACTIVITY_LABEL[opt]}
            </option>
          ))}
        </select>
        {slots.map((s) => (
          <button
            key={s.label}
            disabled={noneSelected}
            title={noneSelected ? "Select disciples first" : `Set ${s.label} to the chosen activity`}
            onClick={() => actions.setActionsForDisciples(selectedIds(), s.target, view.bulkActivity)}
          >
            {s.label}
          </button>
        ))}
      </div>

      <div className="tool-row">
        <span className="tool-label">Sort:</span>
        <select
          className="sort-select"
          title="Sort / group"
          value={view.sort}
          onChange={(e) => dispatch({ type: "setSort", sort: e.target.value as DiscipleSort })}
        >
          {(Object.keys(DISCIPLE_SORT_LABEL) as DiscipleSort[]).map((opt) => (
            <option key={opt} value={opt}>
              {DISCIPLE_SORT_LABEL[opt]}
            </option>
          ))}
        </select>
        <span className="tool-label">Presets:</span>
        {PRESETS.map((p) => (
          <button key={p.label} onClick={() => actions.setAllActions(p.activity)}>
            {p.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function ApplicantsSection({ state }: { state: GameState }): JSX.Element | null {
  const actions = useActions();
  if (state.applicants.length === 0) return null;
  const full = state.disciples.length >= disciplesCapacity(state);

  return (
    <div className="applicants">
      <div className="applicants-divider" />
      <div className="d-group applicants-header">
        Awaiting approval ({state.applicants.length}){full ? " — quarters full" : ""}
      </div>
      {state.applicants.map((a) => (
        <div className="applicant-row" key={a.id}>
          <span className="d-sect" title="Attributes are hidden until accepted">
            ❔
          </span>
          <span className="d-name">{a.name}</span>
          <button
            className="accept-btn"
            disabled={full}
            title={full ? "Quarters are full — upgrade or deny someone first" : "Accept into the sect"}
            onClick={() => actions.acceptApplicant(a.id)}
          >
            Accept
          </button>
          <button className="deny-btn" title="Turn this applicant away" onClick={() => actions.denyApplicant(a.id)}>
            Deny
          </button>
        </div>
      ))}
    </div>
  );
}

export function DisciplesView({ state }: { state: GameState }): JSX.Element {
  const view = useView();
  const ordered = orderedDisciples(state, view.sort);

  const rows: JSX.Element[] = [];
  let lastGroup: string | null = null;
  for (const d of ordered) {
    const key = groupKey(d, view.sort);
    if (key !== null && key !== lastGroup) {
      rows.push(
        <div className="d-group" key={`g-${key}`}>
          {groupLabel(key, view.sort)}
        </div>,
      );
      lastGroup = key;
    }
    rows.push(<DiscipleRow key={d.id} state={state} d={d} />);
  }

  return (
    <Panel title={`Disciples (${state.disciples.length})`}>
      {state.disciples.length === 0 ? (
        <p className="muted">No disciples in the sect yet.</p>
      ) : (
        <>
          <Toolbar state={state} />
          <div className="disciples-list">{rows}</div>
        </>
      )}
      <ApplicantsSection state={state} />
    </Panel>
  );
}
