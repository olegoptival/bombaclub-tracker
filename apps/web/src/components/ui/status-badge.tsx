export type StatusKey =
  | "ended" | "live" | "in_progress" | "disputed" | "cancelled"
  | "auto" | "active" | "pending" | "rejected" | "inactive";

type StatusSpec = { label: string; dot: string; bg: string; fg: string };

const STATUS_MAP: Record<StatusKey, StatusSpec> = {
  ended:       { label: "Ended",       dot: "var(--fg-2)",              bg: "rgba(255,255,255,0.04)",   fg: "var(--fg-1)"       },
  live:        { label: "Live",        dot: "var(--felt)",              bg: "var(--felt-soft)",         fg: "#7ed09a"           },
  in_progress: { label: "In progress", dot: "var(--accent)",            bg: "var(--accent-soft)",       fg: "var(--accent-hi)"  },
  disputed:    { label: "Disputed",    dot: "var(--status-disputed)",   bg: "rgba(217,117,101,0.10)",   fg: "#e89888"           },
  cancelled:   { label: "Cancelled",   dot: "var(--status-cancelled)",  bg: "rgba(255,255,255,0.03)",   fg: "var(--fg-2)"       },
  auto:        { label: "Auto-closed", dot: "var(--fg-2)",              bg: "rgba(255,255,255,0.03)",   fg: "var(--fg-2)"       },
  active:      { label: "Active",      dot: "var(--felt)",              bg: "var(--felt-soft)",         fg: "#7ed09a"           },
  pending:     { label: "Pending",     dot: "var(--accent)",            bg: "var(--accent-soft)",       fg: "var(--accent-hi)"  },
  rejected:    { label: "Rejected",    dot: "var(--status-disputed)",   bg: "rgba(217,117,101,0.10)",   fg: "#e89888"           },
  inactive:    { label: "Inactive",    dot: "var(--fg-3)",              bg: "rgba(255,255,255,0.03)",   fg: "var(--fg-2)"       },
};

export function StatusBadge({
  status,
  size = "md",
}: {
  status: string;
  size?: "md" | "sm";
}) {
  const s = STATUS_MAP[status as StatusKey] ?? STATUS_MAP.ended;
  const py = size === "sm" ? 2 : 4;
  const fs = size === "sm" ? 10.5 : 11.5;

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: `${py}px 8px`,
        background: s.bg,
        color: s.fg,
        borderRadius: 999,
        fontSize: fs,
        fontWeight: 500,
        letterSpacing: "0.01em",
      }}
    >
      <span
        style={{
          width: 5,
          height: 5,
          borderRadius: 999,
          background: s.dot,
          flexShrink: 0,
        }}
      />
      {s.label}
    </span>
  );
}
