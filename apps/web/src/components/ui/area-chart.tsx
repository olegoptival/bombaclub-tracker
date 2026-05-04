"use client";

import { useId } from "react";

export function AreaChart({
  data,
  width = 360,
  height = 120,
  accent = "var(--accent)",
}: {
  data: { value: number; label: string }[];
  width?: number;
  height?: number;
  accent?: string;
}) {
  const gradId = useId();

  if (!data.length) return null;

  const vals = data.map((d) => d.value);
  const min = Math.min(...vals);
  const max = Math.max(...vals);
  const range = max - min || 1;
  const padX = 4;
  const padTop = 8;
  const padBottom = 18;
  const innerW = width - padX * 2;
  const innerH = height - padTop - padBottom;
  const stepX = data.length > 1 ? innerW / (data.length - 1) : innerW;

  const points = data.map((d, i) => {
    const x = padX + i * stepX;
    const y = padTop + (1 - (d.value - min) / range) * innerH;
    return [x, y] as [number, number];
  });

  const linePath = points
    .map(([x, y], i) => (i === 0 ? `M${x},${y}` : `L${x},${y}`))
    .join(" ");

  const last = points[points.length - 1]!;
  const first = points[0]!;
  const fillPath = `${linePath} L${last[0]},${padTop + innerH} L${first[0]},${padTop + innerH} Z`;

  const zeroY = (() => {
    if (min > 0 || max < 0) return null;
    return padTop + (1 - (0 - min) / range) * innerH;
  })();

  const xLabelIndices = [0, Math.floor(data.length / 2), data.length - 1];

  return (
    <svg width={width} height={height} style={{ display: "block" }}>
      <defs>
        <linearGradient id={gradId} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={accent} stopOpacity="0.28" />
          <stop offset="100%" stopColor={accent} stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* horizontal gridlines */}
      {([0.25, 0.5, 0.75] as const).map((p) => (
        <line
          key={p}
          x1={padX}
          x2={width - padX}
          y1={padTop + p * innerH}
          y2={padTop + p * innerH}
          stroke="var(--line)"
          strokeDasharray="2 4"
        />
      ))}

      {/* zero baseline */}
      {zeroY !== null && (
        <line
          x1={padX}
          x2={width - padX}
          y1={zeroY}
          y2={zeroY}
          stroke="var(--line-strong)"
          strokeDasharray="2 3"
        />
      )}

      {/* area fill */}
      <path d={fillPath} fill={`url(#${gradId})`} />

      {/* line */}
      <path
        d={linePath}
        fill="none"
        stroke={accent}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* dots on each point */}
      {points.map(([x, y], i) => (
        <circle
          key={i}
          cx={x}
          cy={y}
          r={2}
          fill={i === points.length - 1 ? accent : "var(--bg-1)"}
          stroke={accent}
          strokeWidth="1.2"
        />
      ))}

      {/* x-axis labels: first / mid / last */}
      {xLabelIndices.map((idx) => {
        const pt = points[idx];
        const item = data[idx];
        if (!pt || !item) return null;
        const anchor =
          idx === 0 ? "start" : idx === data.length - 1 ? "end" : "middle";
        return (
          <text
            key={idx}
            x={pt[0]}
            y={height - 4}
            fontSize={10}
            fill="var(--fg-3)"
            fontFamily="var(--font-mono)"
            textAnchor={anchor}
          >
            {item.label}
          </text>
        );
      })}

      {/* highlight dot on last point */}
      <circle cx={last[0]} cy={last[1]} r={4.5} fill={accent} />
      <circle cx={last[0]} cy={last[1]} r={7} fill={accent} fillOpacity="0.18" />
    </svg>
  );
}
