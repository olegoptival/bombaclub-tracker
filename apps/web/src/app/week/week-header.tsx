import Link from "next/link";
import {
  type IsoWeek,
  compareWeeks,
  currentIsoWeek,
  formatWeekLabel,
  formatWeekParam,
  shiftWeek,
} from "./week-utils";

type Props = {
  week: IsoWeek;
  view: "mine" | "all";
};

export function WeekHeader({ week, view }: Props) {
  const now = currentIsoWeek();
  const isCurrent = compareWeeks(week, now) === 0;

  const prev = shiftWeek(week, -1);
  const next = shiftWeek(week, 1);

  const buildHref = (w: IsoWeek) => {
    const q = new URLSearchParams();
    q.set("week", formatWeekParam(w));
    if (view === "all") q.set("view", "all");
    return `/week?${q.toString()}`;
  };

  return (
    <div style={{ marginBottom: 18 }}>
      <Link
        href="/"
        style={{ fontSize: 13, color: "var(--fg-2)", textDecoration: "none" }}
      >
        ← Back
      </Link>
      <div
        style={{
          marginTop: 14,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
        }}
      >
        <Link
          href={buildHref(prev)}
          aria-label="Previous week"
          className="pkr-btn pkr-btn--ghost pkr-btn--sm"
          style={{ height: 32, width: 32, padding: 0, display: "flex", alignItems: "center", justifyContent: "center" }}
        >
          ←
        </Link>
        <div style={{ textAlign: "center", flex: 1 }}>
          <div style={{ fontSize: 11, color: "var(--fg-3)", textTransform: "uppercase", letterSpacing: 0.06 }}>
            {isCurrent ? "This week" : "Week"}
          </div>
          <div style={{ fontSize: 16, fontWeight: 600, marginTop: 2 }} data-mono>
            {formatWeekLabel(week)}
          </div>
        </div>
        {isCurrent ? (
          <span
            aria-label="Next week (disabled)"
            className="pkr-btn pkr-btn--ghost pkr-btn--sm"
            style={{
              height: 32,
              width: 32,
              padding: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              opacity: 0.3,
              pointerEvents: "none",
            }}
          >
            →
          </span>
        ) : (
          <Link
            href={buildHref(next)}
            aria-label="Next week"
            className="pkr-btn pkr-btn--ghost pkr-btn--sm"
            style={{ height: 32, width: 32, padding: 0, display: "flex", alignItems: "center", justifyContent: "center" }}
          >
            →
          </Link>
        )}
      </div>
    </div>
  );
}
