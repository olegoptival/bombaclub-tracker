// Pure date helpers for ISO week math in UTC.
// All inputs/outputs use UTC. We never look at local timezone.

export type IsoWeek = { year: number; week: number };

// ISO 8601 week number (Mon = day 1). Returns {year, week} for a given Date.
export function isoWeekUtc(d: Date): IsoWeek {
  const t = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  // Thursday in current week decides the year.
  const dayNum = (t.getUTCDay() + 6) % 7; // Mon=0..Sun=6
  t.setUTCDate(t.getUTCDate() - dayNum + 3);
  const firstThursday = new Date(Date.UTC(t.getUTCFullYear(), 0, 4));
  const firstThursdayDay = (firstThursday.getUTCDay() + 6) % 7;
  firstThursday.setUTCDate(firstThursday.getUTCDate() - firstThursdayDay + 3);
  const week = 1 + Math.round((t.getTime() - firstThursday.getTime()) / (7 * 86400000));
  return { year: t.getUTCFullYear(), week };
}

export function currentIsoWeek(): IsoWeek {
  return isoWeekUtc(new Date());
}

export function formatWeekParam(w: IsoWeek): string {
  return `${w.year}-W${String(w.week).padStart(2, "0")}`;
}

// Parses "2026-W17" → IsoWeek. Returns null on bad input.
export function parseWeekParam(raw: string | undefined | null): IsoWeek | null {
  if (!raw) return null;
  const m = /^(\d{4})-W(\d{2})$/.exec(raw.trim());
  if (!m) return null;
  const year = Number(m[1]);
  const week = Number(m[2]);
  if (!Number.isFinite(year) || !Number.isFinite(week)) return null;
  if (week < 1 || week > 53) return null;
  return { year, week };
}

// UTC [start, endExclusive) for given ISO week. Monday 00:00:00 UTC → next Monday 00:00:00 UTC.
export function weekRangeUtc(w: IsoWeek): { start: Date; end: Date } {
  // Jan 4 is always in week 1 (per ISO 8601).
  const jan4 = new Date(Date.UTC(w.year, 0, 4));
  const jan4Day = (jan4.getUTCDay() + 6) % 7; // Mon=0..Sun=6
  const week1Monday = new Date(jan4);
  week1Monday.setUTCDate(jan4.getUTCDate() - jan4Day);
  const start = new Date(week1Monday);
  start.setUTCDate(week1Monday.getUTCDate() + (w.week - 1) * 7);
  const end = new Date(start);
  end.setUTCDate(start.getUTCDate() + 7);
  return { start, end };
}

// "Apr 22 – Apr 28, 2026" (UTC dates, no time).
export function formatWeekLabel(w: IsoWeek): string {
  const { start, end } = weekRangeUtc(w);
  const last = new Date(end);
  last.setUTCDate(end.getUTCDate() - 1); // inclusive last day
  const fmt = (d: Date) =>
    d.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      timeZone: "UTC",
    });
  const year = last.getUTCFullYear();
  return `${fmt(start)} – ${fmt(last)}, ${year}`;
}

// Returns -1 if a<b, 0 if equal, 1 if a>b.
export function compareWeeks(a: IsoWeek, b: IsoWeek): number {
  if (a.year !== b.year) return a.year < b.year ? -1 : 1;
  if (a.week !== b.week) return a.week < b.week ? -1 : 1;
  return 0;
}

// Shift week by +1 or -1.
export function shiftWeek(w: IsoWeek, delta: number): IsoWeek {
  const { start } = weekRangeUtc(w);
  const shifted = new Date(start);
  shifted.setUTCDate(start.getUTCDate() + delta * 7);
  return isoWeekUtc(shifted);
}
