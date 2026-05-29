// Disciples tab: a management toolbar (selection, bulk actions, sort, presets) over a
// compact, expandable roster grouped by the chosen sort, plus the pending-applicants section.

import { useState } from "react";
import { Panel } from "../components/Panel";
import { fmt } from "../components/format";
import type { GameState } from "../../state/gameState";
import { useActions } from "../engineContext";
import { TECHNIQUES } from "../../data/techniques/techniqueDefs";
import { TechniqueModal } from "../techniques/TechniqueModal";
import type { SlotTarget } from "../../core/engine";
import { useView, useViewDispatch, DISCIPLE_SORT_LABEL, type DiscipleSort } from "../viewContext";
import { maxHp, type Activity, type Disciple } from "../../domain/disciples/disciple";
import { progressFraction, type AttrProgress } from "../../domain/disciples/attributes";
import {
  ACTIVITY_LABEL,
  ACTIVITY_OPTIONS,
  ACTIVITY_GROUP,
  ACTIVITY_GROUP_LABEL,
  jobBuildingOf,
  type ActivityGroup,
} from "../../domain/disciples/actions";
import { disciplesCapacity } from "../../domain/buildings/buildings";
import {
  ATTRIBUTE_LABEL,
  SECT_ICON,
  SECT_ATTRIBUTE,
  type Attribute,
} from "../../domain/sect/sectTypes";
import { STARS_PER_RANK, rankName, rankTierClass } from "../../data/progression";
import { TALENT_BY_ID, TALENT_TIER_CLASS } from "../../data/talent";
import { TRAIT_BY_ID } from "../../data/traits";
import {
  AMBITIONS,
  DESTINIES,
  FEARS,
  ORIGINS,
  type DestinyId,
} from "../../data/disciples/narratives";
import { PATH_LABEL } from "../../domain/disciples/paths";
import { ageInYears } from "../../domain/disciples/aging";
import { applicantDaysLeft } from "../../domain/disciples/recruitment";
import { orderedDisciples, groupKey, groupLabel } from "./discipleOrder";
import {
  EQUIPMENT_SLOTS,
  EQUIPMENT_SLOT_LABEL,
  ITEM_TIER_CLASS,
  ITEM_TIER_LABEL,
  type EquipmentSlot,
  type EquippedItem,
} from "../../data/equipment";
import { BLUEPRINT_BY_ID } from "../../data/blueprints";

const ATTR_ORDER: Attribute[] = ["health", "strength", "dexterity", "vitality"];
const SLOT_LABELS = ["Morning", "Afternoon", "Night"];
const GROUP_ORDER: ActivityGroup[] = ["collect", "study", "work"];

/** All current Activity options grouped for an optgroup-style <select>, hiding job
 *  options that target an unbuilt pavilion (so the player doesn't pick a no-op). */
function availableActivityGroups(state: GameState): { group: ActivityGroup; options: Activity[] }[] {
  const buckets: Record<ActivityGroup, Activity[]> = { collect: [], study: [], work: [] };
  for (const opt of ACTIVITY_OPTIONS) {
    const building = jobBuildingOf(opt);
    if (building && state.buildings[building].level === 0) continue;
    buckets[ACTIVITY_GROUP[opt]].push(opt);
  }
  return GROUP_ORDER.filter((g) => buckets[g].length > 0).map((g) => ({ group: g, options: buckets[g] }));
}

function ActivityOptions({ groups }: { groups: { group: ActivityGroup; options: Activity[] }[] }): JSX.Element {
  return (
    <>
      {groups.map(({ group, options }) => (
        <optgroup key={group} label={ACTIVITY_GROUP_LABEL[group]}>
          {options.map((opt) => (
            <option key={opt} value={opt}>
              {ACTIVITY_LABEL[opt]}
            </option>
          ))}
        </optgroup>
      ))}
    </>
  );
}
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

function EquipmentSlotView({
  slot,
  item,
  onUnequip,
}: {
  slot: EquipmentSlot;
  item: EquippedItem | null;
  onUnequip: () => void;
}): JSX.Element {
  if (!item) {
    return (
      <div className="equip-slot empty" title={`${EQUIPMENT_SLOT_LABEL[slot]} — empty (equip from the Craft tab)`}>
        <span className="equip-slot-label muted">{EQUIPMENT_SLOT_LABEL[slot]}</span>
        <span className="equip-slot-item muted">—</span>
      </div>
    );
  }
  const bp = BLUEPRINT_BY_ID[item.blueprintId];
  const name = bp?.name ?? item.blueprintId;
  return (
    <button
      className={`equip-slot filled ${ITEM_TIER_CLASS[item.tier]}`.trim()}
      title={`${name} (${ITEM_TIER_LABEL[item.tier]}) — click to unequip`}
      onClick={onUnequip}
    >
      <span className="equip-slot-label muted">{EQUIPMENT_SLOT_LABEL[slot]}</span>
      <span className="equip-slot-item">{name}</span>
    </button>
  );
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

/** Compact one-line summary of a disciple's three daily activity slots — replaces the three
 *  selects in the compact row, which now live inside the expanded view. */
function ActivitySummary({ actions }: { actions: [Activity, Activity, Activity] }): JSX.Element {
  const tooltip = actions
    .map((a, i) => `${SLOT_LABELS[i]}: ${ACTIVITY_LABEL[a]}`)
    .join(" · ");
  return (
    <span className="d-activity-summary" title={tooltip}>
      {actions.map((a, i) => (
        <span key={i} className="d-activity-pill">
          {ACTIVITY_LABEL[a]}
        </span>
      ))}
    </span>
  );
}

function DiscipleRow({ state, d }: { state: GameState; d: Disciple }): JSX.Element {
  const actions = useActions();
  const view = useView();
  const dispatch = useViewDispatch();
  const [techPickerOpen, setTechPickerOpen] = useState(false);
  const sectAttr = SECT_ATTRIBUTE[state.sect.type];
  const down = d.status === "down";
  const selected = view.selectedIds.has(d.id);
  const expanded = view.expandedIds.has(d.id);
  const activityGroups = availableActivityGroups(state);

  return (
    <div className={`d-row ${down ? "is-down" : ""} ${selected ? "sel" : ""}`.trim()}>
      <div className="d-head">
        <input
          type="checkbox"
          className="d-check"
          checked={selected}
          onChange={() => dispatch({ type: "toggleSelected", id: d.id })}
        />
        <span className="d-sect" title={`Prefers ${d.preferredSect}`}>
          {SECT_ICON[d.preferredSect]}
        </span>
        {d.path && (
          <span className={`d-path path-${d.path}`} title={PATH_LABEL[d.path]}>
            {d.path === "body" ? "⚔" : "✦"}
          </span>
        )}
        <span className="d-name">{d.name}</span>
        <span
          className={`d-joy ${happinessClass(d.happiness)}`}
          aria-label={`Happiness ${fmt(d.happiness)} (${happinessClass(d.happiness)})`}
          title="Happiness"
        >
          <span aria-hidden="true">♥ {fmt(d.happiness)}</span>
        </span>
        <span
          className="d-hp"
          aria-label={`HP ${fmt(d.hp)} of ${fmt(maxHp(d))}`}
          title="HP"
        >
          {fmt(d.hp)}/{fmt(maxHp(d))}
        </span>
        {down ? (
          <span className="badge badge-down">Recovering</span>
        ) : (
          <ActivitySummary actions={d.actions} />
        )}
        <button
          className="d-expand"
          title={expanded ? "Hide details" : "Show details"}
          onClick={() => dispatch({ type: "toggleExpanded", id: d.id })}
        >
          {expanded ? "▾" : "▸"}
        </button>
      </div>
      {expanded && (
        <div className="d-expanded">
          {/* Identity strip: talent / trait / age / bonds */}
          <div className="d-meta">
            {d.role && d.role !== "young" && (
              <span className={`d-role d-role-${d.role}`} title={`${d.role} of the sect`}>
                {d.role === "elder" ? "✦ Elder" : "◈ Master"}
              </span>
            )}
            <span
              className={`d-talent ${TALENT_TIER_CLASS[d.talent]}`}
              title={`Spirit root: ${TALENT_BY_ID[d.talent].label} (×${TALENT_BY_ID[d.talent].xpMult} XP)`}
            >
              ◈ {TALENT_BY_ID[d.talent].label}
            </span>
            <span
              className={`d-trait trait-${d.trait}`}
              title={TRAIT_BY_ID[d.trait].description}
            >
              {TRAIT_BY_ID[d.trait].label}
            </span>
            <span className="d-age muted" title="Age (in-game years)">
              {ageInYears(d)}y
            </span>
            {d.bonds.length > 0 && (
              <span
                className="d-bonds"
                title={`${d.bonds.length} bond${d.bonds.length === 1 ? "" : "s"}`}
              >
                ♥ {d.bonds.length} bond{d.bonds.length === 1 ? "" : "s"}
              </span>
            )}
          </div>

          {/* Narrative layers (B2): backstory, drive, fear, and once-stamped trauma/destiny. */}
          <div className="d-narrative">
            <div className="d-narrative-row">
              <span className="d-narr-label">Origin</span>
              <span className="d-narr-value" title={ORIGINS[d.origin].description}>
                {ORIGINS[d.origin].label}
              </span>
            </div>
            <div className="d-narrative-row">
              <span className="d-narr-label">Ambition</span>
              <span className="d-narr-value" title={AMBITIONS[d.ambition].description}>
                {AMBITIONS[d.ambition].label}
              </span>
            </div>
            <div className="d-narrative-row">
              <span className="d-narr-label">Fear</span>
              <span className="d-narr-value" title={FEARS[d.fear].description}>
                {FEARS[d.fear].label}
              </span>
            </div>
            {d.trauma && (
              <div className="d-narrative-row d-narr-trauma">
                <span className="d-narr-label">Trauma</span>
                <span className="d-narr-value">{d.trauma}</span>
              </div>
            )}
            {d.destiny && (
              <div className="d-narrative-row d-narr-destiny">
                <span className="d-narr-label">Destiny</span>
                <span
                  className="d-narr-value"
                  title={DESTINIES[d.destiny as DestinyId]?.description ?? ""}
                >
                  {DESTINIES[d.destiny as DestinyId]?.label ?? d.destiny}
                </span>
              </div>
            )}
          </div>

          {/* Attributes + equipment side-by-side */}
          <div className="d-expanded-main">
            <div className="d-attrs">
              {ATTR_ORDER.map((attr) => (
                <AttrRow
                  key={attr}
                  a={d.attributes[attr]}
                  attr={attr}
                  isSectAttr={attr === sectAttr}
                />
              ))}
            </div>
            <div className="d-equipment" aria-label="Equipment">
              {EQUIPMENT_SLOTS.map((slot) => (
                <EquipmentSlotView
                  key={slot}
                  slot={slot}
                  item={d.equipment[slot]}
                  onUnequip={() => actions.unequipItem(d.id, slot)}
                />
              ))}
            </div>
          </div>

          {/* Daily action slots — labelled selects per period */}
          {!down && (
            <div className="d-actions-row">
              <span className="muted d-actions-label">Daily actions</span>
              <div className="d-actions">
                {[0, 1, 2].map((slot) => (
                  <label key={slot} className="d-slot">
                    <span className="d-slot-label muted">{SLOT_LABELS[slot]}</span>
                    <select
                      className="action-select"
                      value={d.actions[slot]}
                      onChange={(e) =>
                        actions.setDiscipleAction(d.id, slot, e.target.value as Activity)
                      }
                    >
                      <ActivityOptions groups={activityGroups} />
                    </select>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Pills row: healing if down, tribulation aid / insight otherwise */}
          {(() => {
            const hasHeal = down && (state.pills.healing ?? 0) > 0;
            const hasAid =
              !down && !d.tribulationBuff && (state.pills.tribulationAid ?? 0) > 0;
            const hasInsight = !down && (state.pills.insight ?? 0) > 0;
            if (!hasHeal && !hasAid && !hasInsight && !d.tribulationBuff) return null;
            return (
              <div className="d-pills-row">
                <span className="muted d-pills-label">Pills</span>
                {hasHeal && (
                  <button
                    className="d-heal"
                    title="Use a Healing Pill"
                    onClick={() => actions.usePill("healing", d.id)}
                  >
                    🧪 Heal
                  </button>
                )}
                {!down && d.tribulationBuff && (
                  <span
                    className="d-aided"
                    title="Tribulation Aid is active — consumed on next breakthrough"
                  >
                    🪷 Tribulation Aid active
                  </span>
                )}
                {hasAid && (
                  <button
                    className="d-aid"
                    title="Use a Tribulation Aid (halves the next breakthrough's fail chance)"
                    onClick={() => actions.usePill("tribulationAid", d.id)}
                  >
                    🪷 Tribulation Aid
                  </button>
                )}
                {hasInsight && (
                  <button
                    className="d-insight"
                    title="Use an Insight Pill (XP to every attribute)"
                    onClick={() => actions.usePill("insight", d.id)}
                  >
                    🧠 Insight
                  </button>
                )}
              </div>
            );
          })()}

          {/* Techniques (C2): learned techniques + Learn button for the picker. */}
          <div className="d-techniques">
            <span className="muted d-tech-label">Techniques</span>
            {(d.techniques?.length ?? 0) > 0 ? (
              <div className="d-tech-list">
                {d.techniques.map((id) => {
                  const def = TECHNIQUES[id];
                  return (
                    <span
                      key={id}
                      className="d-tech-pill"
                      title={`${def?.description ?? ""}\n+ ${def?.bonus ?? ""}\n− ${def?.penalty ?? ""}`}
                    >
                      ◆ {def?.name ?? id}
                    </span>
                  );
                })}
              </div>
            ) : (
              <span className="muted">No techniques learned.</span>
            )}
            <button className="d-tech-learn" onClick={() => setTechPickerOpen(true)}>
              Learn…
            </button>
          </div>

          {/* Destructive: expel */}
          <div className="d-expanded-footer">
            <button
              className="expel-btn"
              title="Permanently remove this disciple from the sect (bonded friends will grieve)"
              onClick={() => {
                if (window.confirm(`Expel ${d.name} from the sect? This can't be undone.`)) {
                  actions.expelDisciple(d.id);
                }
              }}
            >
              Expel from Sect
            </button>
          </div>
        </div>
      )}
      {techPickerOpen && (
        <TechniqueModal state={state} discipleId={d.id} onClose={() => setTechPickerOpen(false)} />
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

  const invertSelection = (): void => {
    const inverted = state.disciples.filter((d) => !view.selectedIds.has(d.id)).map((d) => d.id);
    dispatch({ type: "setSelected", ids: inverted });
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
        <button
          onClick={invertSelection}
          title="Flip the current selection — selected become unselected and vice versa"
        >
          Invert
        </button>
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
          <ActivityOptions groups={availableActivityGroups(state)} />
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
      {state.applicants.map((a) => {
        const left = applicantDaysLeft(state, a.arrivedOnDay);
        const urgent = left <= 5;
        return (
          <div className="applicant-row" key={a.id}>
            <span className="d-sect" title="Attributes are hidden until accepted">
              ❔
            </span>
            <span className="d-name">{a.name}</span>
            <span
              className={`applicant-timer ${urgent ? "urgent" : ""}`.trim()}
              title={`Leaves on their own in ${left} day${left === 1 ? "" : "s"} if not Accepted or Denied`}
            >
              ⏳ {left}d left
            </span>
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
        );
      })}
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
