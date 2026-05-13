import type { AreaChartPoint } from "./types";

function fmtSigned(n: number): string {
  const abs = Math.abs(n).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  if (n > 0) return `+${abs}`;
  if (n < 0) return `\u2212${abs}`;
  return abs;
}

function colorFor(n: number): string {
  if (n > 0) return "var(--pos, #6dca7a)";
  if (n < 0) return "var(--neg, #e5746a)";
  return "var(--fg-1)";
}

export function AreaChartTooltip({
  point,
  x,
  y,
  containerWidth,
}: {
  point: AreaChartPoint;
  x: number;
  y: number;
  containerWidth: number;
}) {
  const tooltipWidth = 168;
  const offsetY = 12;
  // Keep the tooltip inside the container horizontally
  let left = x - tooltipWidth / 2;
  if (left < 4) left = 4;
  if (left + tooltipWidth > containerWidth - 4) {
    left = containerWidth - 4 - tooltipWidth;
  }
  const top = Math.max(0, y - 70);

  const pnl = point.meta?.pnl ?? 0;

  return (
    <div
      role="tooltip"
      style={{
        position: "absolute",
        left,
        top,
        width: tooltipWidth,
        pointerEvents: "none",
        background: "var(--bg-1)",
        border: "0.5px solid var(--line-strong, var(--line))",
        borderRadius: 8,
        padding: "8px 10px",
        boxShadow: "var(--shadow-md, 0 6px 18px rgba(0,0,0,0.35))",
        fontSize: 12,
        lineHeight: 1.35,
        zIndex: 10,
      }}
    >
      <div
        data-mono
        style={{ color: "var(--fg-2)", fontSize: 11, marginBottom: 4 }}
      >
        {point.meta?.dateLabel ?? point.x}
      </div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "baseline",
          gap: 10,
        }}
      >
        <span style={{ color: "var(--fg-2)" }}>PnL</span>
        <span data-mono style={{ color: colorFor(pnl), fontWeight: 500 }}>
          {fmtSigned(pnl)}
        </span>
      </div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "baseline",
          gap: 10,
          marginTop: 2,
        }}
      >
        <span style={{ color: "var(--fg-2)" }}>Cumul</span>
        <span data-mono style={{ color: colorFor(point.value), fontWeight: 500 }}>
          {fmtSigned(point.value)}
        </span>
      </div>
    </div>
  );
}
