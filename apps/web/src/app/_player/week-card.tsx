import Link from "next/link";
import { Prisma } from "@prisma/client";
import { Icon } from "@/components/ui/icon";

type Props = {
  totalPnl: Prisma.Decimal;
  sessionsCount: number;
};

export function WeekCard({ totalPnl, sessionsCount }: Props) {
  const num = parseFloat(totalPnl.toString());
  const color = num > 0 ? "var(--pos)" : num < 0 ? "var(--neg)" : "var(--fg-1)";
  const sign = num > 0 ? "+" : num < 0 ? "−" : "";

  return (
    <Link
      href="/week"
      className="pkr-week-card"
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 12,
        padding: 16,
        marginBottom: 14,
        textDecoration: "none",
        color: "inherit",
        background:
          "linear-gradient(135deg, color-mix(in srgb, var(--accent) 10%, var(--bg-1)) 0%, var(--bg-1) 60%)",
        border: "1px solid color-mix(in srgb, var(--accent) 35%, var(--line))",
        borderRadius: "var(--r-md, 12px)",
        transition: "transform 120ms ease, border-color 120ms ease",
      }}
    >
      <div style={{ minWidth: 0, display: "flex", flexDirection: "column", gap: 2 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            fontSize: 10.5,
            fontWeight: 600,
            color: "var(--accent-hi)",
            textTransform: "uppercase",
            letterSpacing: 0.08,
          }}
        >
          <Icon name="trend" size={12} />
          <span>This week</span>
        </div>
        <div
          data-mono
          style={{
            fontSize: 24,
            fontWeight: 700,
            color,
            letterSpacing: "-0.01em",
            lineHeight: 1.1,
            marginTop: 2,
          }}
        >
          {sessionsCount === 0 ? "—" : `${sign}${Math.abs(num).toFixed(2)}`}
        </div>
        <div style={{ fontSize: 11.5, color: "var(--fg-2)", marginTop: 2 }}>
          {sessionsCount === 0
            ? "No online sessions yet · tap to view"
            : `${sessionsCount} online session${sessionsCount !== 1 ? "s" : ""} · tap for details`}
        </div>
      </div>

      <div
        aria-hidden
        style={{
          flexShrink: 0,
          width: 44,
          height: 44,
          borderRadius: 999,
          background: "var(--accent)",
          color: "var(--bg-0)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0 4px 14px -2px color-mix(in srgb, var(--accent) 45%, transparent)",
        }}
      >
        <Icon name="chevR" size={20} />
      </div>
    </Link>
  );
}
