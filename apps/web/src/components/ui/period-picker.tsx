import Link from "next/link";

export type Period = "week" | "month" | "all";

const OPTS: { id: Period; label: string }[] = [
  { id: "week", label: "This week" },
  { id: "month", label: "This month" },
  { id: "all", label: "All time" },
];

export function PeriodPicker({
  value,
  basePath = "/",
}: {
  value: Period;
  basePath?: string;
}) {
  return (
    <div
      role="tablist"
      aria-label="Statistics period"
      style={{
        display: "inline-flex",
        padding: 2,
        borderRadius: 999,
        background: "var(--bg-2)",
        boxShadow: "0 0 0 0.5px var(--line) inset",
        gap: 0,
      }}
    >
      {OPTS.map((o) => {
        const on = o.id === value;
        const href = o.id === "all" ? basePath : `${basePath}?period=${o.id}`;
        return (
          <Link
            key={o.id}
            href={href}
            role="tab"
            aria-selected={on}
            scroll={false}
            style={{
              padding: "6px 12px",
              background: on ? "var(--bg-3, var(--bg-1))" : "transparent",
              color: on ? "var(--fg-0, var(--fg-1))" : "var(--fg-2)",
              borderRadius: 999,
              fontSize: 12,
              fontWeight: 500,
              letterSpacing: 0.01,
              textDecoration: "none",
              boxShadow: on
                ? "0 0 0 0.5px var(--line-strong, var(--line)) inset"
                : "none",
              transition: "background 120ms, color 120ms",
              whiteSpace: "nowrap",
              lineHeight: 1.2,
              textAlign: "center",
            }}
          >
            {o.label}
          </Link>
        );
      })}
    </div>
  );
}
