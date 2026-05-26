// Disciples tab: a management toolbar (selection, bulk actions, sort, presets) over a
// compact, expandable roster grouped by the chosen sort.

import { el, panel } from "../components/el";
import { fmt } from "../components/format";
import type { GameState } from "../../state/gameState";
import type { GameActions, SlotTarget } from "../gameActions";
import { DISCIPLE_SORT_LABEL, type DiscipleSort, type ViewState } from "../viewState";
import { maxHp, type Activity, type Disciple } from "../../domain/disciples/disciple";
import {
  progressFraction,
  type AttrProgress,
} from "../../domain/disciples/attributes";
import { ACTIVITY_LABEL, ACTIVITY_OPTIONS } from "../../domain/disciples/actions";
import { disciplesCapacity } from "../../domain/buildings/buildings";
import {
  ATTRIBUTE_LABEL,
  SECT_ICON,
  SECT_LABEL,
  SECT_ATTRIBUTE,
  SECT_TYPES,
  type Attribute,
} from "../../domain/sect/sectTypes";
import { STARS_PER_RANK, rankName, rankTierClass } from "../../data/progression";

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

/** The roster in the order dictated by the current sort. Shared with the controller for %-selection. */
export function orderedDisciples(state: GameState, sort: DiscipleSort): Disciple[] {
  const list = [...state.disciples];
  switch (sort) {
    case "sect":
      return list.sort(
        (a, b) =>
          SECT_TYPES.indexOf(a.preferredSect) - SECT_TYPES.indexOf(b.preferredSect) || a.id - b.id,
      );
    case "happiness":
      return list.sort((a, b) => b.happiness - a.happiness || a.id - b.id);
    case "status":
      return list.sort(
        (a, b) => (a.status === "down" ? 0 : 1) - (b.status === "down" ? 0 : 1) || a.id - b.id,
      );
    default:
      return list.sort((a, b) => a.id - b.id);
  }
}

function groupKey(d: Disciple, sort: DiscipleSort): string | null {
  if (sort === "sect") return d.preferredSect;
  if (sort === "status") return d.status;
  return null;
}

function groupLabel(key: string, sort: DiscipleSort): string {
  if (sort === "sect") return SECT_LABEL[key as keyof typeof SECT_LABEL];
  return key === "down" ? "Recovering" : "Active";
}

function attrRow(a: AttrProgress, attr: Attribute, isSectAttr: boolean): HTMLElement {
  const stars = "★".repeat(a.star) + "☆".repeat(STARS_PER_RANK - a.star);
  const pct = Math.round(progressFraction(a) * 100);
  const row = el(
    "div",
    {
      class: `attr-row ${rankTierClass(a.rank)} ${isSectAttr ? "is-sect-attr" : ""}`.trim(),
      title: `${ATTRIBUTE_LABEL[attr]} — ${rankName(a.rank)} · ${a.star}/${STARS_PER_RANK}★ · ${pct}% to next`,
    },
    [
      el("span", { class: "attr-name", text: ATTRIBUTE_LABEL[attr] }),
      el("span", { class: "attr-rank", text: rankName(a.rank) }),
      el("span", { class: "attr-stars", text: stars }),
    ],
  );
  const xp = el("div", { class: "attr-xp" }, [el("div", { class: "attr-xp-fill" })]);
  (xp.firstElementChild as HTMLElement).style.width = `${pct}%`;
  row.append(xp);
  return row;
}

function actionSelect(actions: GameActions, d: Disciple, slot: number): HTMLElement {
  const select = el("select", {
    class: "action-select",
    title: SLOT_LABELS[slot],
    onChange: (e) =>
      actions.setDiscipleAction(d.id, slot, (e.target as HTMLSelectElement).value as Activity),
  });
  for (const opt of ACTIVITY_OPTIONS) {
    const o = el("option", { value: opt, text: ACTIVITY_LABEL[opt] });
    if (opt === d.actions[slot]) o.selected = true;
    select.append(o);
  }
  return select;
}

function discipleRow(
  view: ViewState,
  actions: GameActions,
  sectAttr: Attribute,
  d: Disciple,
): HTMLElement {
  const down = d.status === "down";
  const selected = view.selectedIds.has(d.id);
  const expanded = view.expandedIds.has(d.id);

  const checkbox = el("input", {
    class: "d-check",
    onChange: () => actions.toggleDiscipleSelected(d.id),
  }) as HTMLInputElement;
  checkbox.type = "checkbox";
  checkbox.checked = selected;

  const head = el("div", { class: "d-head" }, [
    checkbox,
    el("button", {
      class: "d-expand",
      text: expanded ? "▾" : "▸",
      title: "Show attributes",
      onClick: () => actions.toggleDiscipleExpanded(d.id),
    }),
    el("span", { class: "d-sect", text: SECT_ICON[d.preferredSect], title: `Prefers ${d.preferredSect}` }),
    el("span", { class: "d-name", text: d.name }),
    el("span", { class: `d-joy ${happinessClass(d.happiness)}`, title: "Happiness", text: `♥ ${fmt(d.happiness)}` }),
    el("span", { class: "d-hp", title: "HP", text: `${fmt(d.hp)}/${fmt(maxHp(d))}` }),
    down
      ? el("span", { class: "badge badge-down", text: "Recovering" })
      : el("div", { class: "d-actions" }, [0, 1, 2].map((s) => actionSelect(actions, d, s))),
  ]);

  const row = el("div", { class: `d-row ${down ? "is-down" : ""} ${selected ? "sel" : ""}`.trim() }, [
    head,
  ]);

  if (expanded) {
    row.append(
      el(
        "div",
        { class: "d-attrs" },
        ATTR_ORDER.map((attr) => attrRow(d.attributes[attr], attr, attr === sectAttr)),
      ),
    );
  }
  return row;
}

function toolbar(state: GameState, view: ViewState, actions: GameActions): HTMLElement {
  const total = state.disciples.length;
  const sel = view.selectedIds.size;
  const noneSelected = sel === 0;

  const selectRow = el("div", { class: "tool-row" }, [
    el("span", { class: "tool-label", text: "Select:" }),
    ...[0.25, 0.5, 0.75, 1].map((f) =>
      el("button", { text: `${f * 100}%`, onClick: () => actions.selectDisciplePortion(f) }),
    ),
    el("button", { text: "None", onClick: () => actions.selectDisciplePortion(0) }),
    el("span", { class: "tool-count", text: `${sel} / ${total} selected` }),
  ]);

  const bulkSelect = el("select", {
    class: "bulk-activity",
    title: "Activity to apply",
    onChange: (e) => actions.setBulkActivity((e.target as HTMLSelectElement).value as Activity),
  });
  for (const opt of ACTIVITY_OPTIONS) {
    const o = el("option", { value: opt, text: ACTIVITY_LABEL[opt] });
    if (opt === view.bulkActivity) o.selected = true;
    bulkSelect.append(o);
  }
  const slots: { label: string; target: SlotTarget }[] = [
    { label: "Morning", target: 0 },
    { label: "Afternoon", target: 1 },
    { label: "Night", target: 2 },
    { label: "All 3", target: "all" },
  ];
  const bulkRow = el("div", { class: "tool-row" }, [
    el("span", { class: "tool-label", text: "Set selected →" }),
    bulkSelect,
    ...slots.map((s) =>
      el("button", {
        text: s.label,
        disabled: noneSelected,
        title: noneSelected ? "Select disciples first" : `Set ${s.label} to the chosen activity`,
        onClick: () => actions.applyActionToSelected(s.target, view.bulkActivity),
      }),
    ),
  ]);

  const sortSelect = el("select", {
    class: "sort-select",
    title: "Sort / group",
    onChange: (e) => actions.setDiscipleSort((e.target as HTMLSelectElement).value as DiscipleSort),
  });
  for (const opt of Object.keys(DISCIPLE_SORT_LABEL) as DiscipleSort[]) {
    const o = el("option", { value: opt, text: DISCIPLE_SORT_LABEL[opt] });
    if (opt === view.sort) o.selected = true;
    sortSelect.append(o);
  }
  const sortRow = el("div", { class: "tool-row" }, [
    el("span", { class: "tool-label", text: "Sort:" }),
    sortSelect,
    el("span", { class: "tool-label", text: "Presets:" }),
    ...PRESETS.map((p) =>
      el("button", { text: p.label, onClick: () => actions.applyPresetToAll(p.activity) }),
    ),
  ]);

  return el("div", { class: "disciples-toolbar" }, [selectRow, bulkRow, sortRow]);
}

/** Pending applicants: name + Accept/Deny only; attributes stay hidden until accepted. */
function applicantsSection(state: GameState, actions: GameActions): HTMLElement | null {
  if (state.applicants.length === 0) return null;
  const full = state.disciples.length >= disciplesCapacity(state);

  const rows = state.applicants.map((a) =>
    el("div", { class: "applicant-row" }, [
      el("span", { class: "d-sect", text: "❔", title: "Attributes are hidden until accepted" }),
      el("span", { class: "d-name", text: a.name }),
      el("button", {
        class: "accept-btn",
        text: "Accept",
        disabled: full,
        title: full ? "Quarters are full — upgrade or deny someone first" : "Accept into the sect",
        onClick: () => actions.acceptApplicant(a.id),
      }),
      el("button", {
        class: "deny-btn",
        text: "Deny",
        title: "Turn this applicant away",
        onClick: () => actions.denyApplicant(a.id),
      }),
    ]),
  );

  return el("div", { class: "applicants" }, [
    el("div", { class: "applicants-divider" }),
    el("div", {
      class: "d-group applicants-header",
      text: `Awaiting approval (${state.applicants.length})${full ? " — quarters full" : ""}`,
    }),
    ...rows,
  ]);
}

export function disciplesView(state: GameState, view: ViewState, actions: GameActions): HTMLElement {
  const sectAttr = SECT_ATTRIBUTE[state.sect.type];
  const body: HTMLElement[] = [];

  if (state.disciples.length === 0) {
    body.push(el("p", { class: "muted", text: "No disciples in the sect yet." }));
  } else {
    body.push(toolbar(state, view, actions));
    const ordered = orderedDisciples(state, view.sort);
    const rows: HTMLElement[] = [];
    let lastGroup: string | null = null;
    for (const d of ordered) {
      const key = groupKey(d, view.sort);
      if (key !== null && key !== lastGroup) {
        rows.push(el("div", { class: "d-group", text: groupLabel(key, view.sort) }));
        lastGroup = key;
      }
      rows.push(discipleRow(view, actions, sectAttr, d));
    }
    body.push(el("div", { class: "disciples-list" }, rows));
  }

  const applicants = applicantsSection(state, actions);
  if (applicants) body.push(applicants);

  return panel(`Disciples (${state.disciples.length})`, body);
}
