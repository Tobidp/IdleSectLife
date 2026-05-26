// Calendar: 30 days/month, 12 months/year. Drives season changes.

import { seasonForMonth, SEASON_LABEL, type Season } from "../../data/seasons";

export const DAYS_PER_MONTH = 30;
export const MONTHS_PER_YEAR = 12;

export interface TimeState {
  day: number; // 1..30
  month: number; // 1..12
  year: number; // 1..
  totalDays: number; // absolute counter since game start
}

export interface DayAdvanceResult {
  monthChanged: boolean;
  yearChanged: boolean;
  seasonChanged: boolean;
}

export function initialTime(): TimeState {
  return { day: 1, month: 1, year: 1, totalDays: 0 };
}

/** Advance the calendar by one day, mutating `t`. Reports rollovers. */
export function advanceOneDay(t: TimeState): DayAdvanceResult {
  const prevSeason = seasonForMonth(t.month);
  let monthChanged = false;
  let yearChanged = false;

  t.day += 1;
  t.totalDays += 1;

  if (t.day > DAYS_PER_MONTH) {
    t.day = 1;
    t.month += 1;
    monthChanged = true;
    if (t.month > MONTHS_PER_YEAR) {
      t.month = 1;
      t.year += 1;
      yearChanged = true;
    }
  }

  const seasonChanged = seasonForMonth(t.month) !== prevSeason;
  return { monthChanged, yearChanged, seasonChanged };
}

export function currentSeason(t: TimeState): Season {
  return seasonForMonth(t.month);
}

export function formatDate(t: TimeState): string {
  return `Year ${t.year} · Month ${t.month} · Day ${t.day}`;
}

export function formatDateShort(t: TimeState): string {
  return `Y${t.year} M${t.month} D${t.day} (${SEASON_LABEL[currentSeason(t)]})`;
}
