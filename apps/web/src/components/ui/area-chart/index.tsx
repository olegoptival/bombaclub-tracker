"use client";

import { useEffect, useId, useRef, useState, useCallback } from "react";
import type { CSSProperties, PointerEvent as ReactPointerEvent } from "react";
import { AreaChartTooltip } from "./tooltip";
import {
  computeGeometry,
  fillPath,
  linePath,
  nearestPointIndex,
  zeroBaseline,
} from "./geometry";
import type { AreaChartPoint } from "./types";

export type { AreaChartPoint, AreaChartPointMeta } from "./types";

/** Pixel-space distance threshold (in viewBox units) for a tap to register. */
const TAP_HIT_RADIUS = 28;

export function AreaChart({
  data,
  width = 420,
  height = 140,
  accent = "var(--accent)",
  style,
}: {
  data: AreaChartPoint[];
  width?: number;
  height?: number;
  accent?: string;
  style?: CSSProperties;
}) {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);
  const gradId = useId();

  const geom = computeGeometry(data, width, height);
  const { points, padX, padTop, innerH } = geom;

  /** Convert a client X coordinate into the SVG's user-space X. */
  const clientToUserX = useCallback(
    (clientX: number): number | null => {
      const svg = svgRef.current;
      if (!svg) return null;
      const rect = svg.getBoundingClientRect();
      if (rect.width === 0) return null;
      return ((clientX - rect.left) / rect.width) * width;
    },
    [width],
  );

  // Mouse hover (desktop)
  const handleMove = useCallback(
    (e: ReactPointerEvent<SVGSVGElement>) => {
      if (e.pointerType !== "mouse") return;
      const userX = clientToUserX(e.clientX);
      if (userX === null || data.length === 0) return;
      const idx = nearestPointIndex(points, userX);
      setHoverIdx(idx >= 0 ? idx : null);
    },
    [clientToUserX, data.length, points],
  );

  const handleLeave = useCallback(
    (e: ReactPointerEvent<SVGSVGElement>) => {
      // Mouse leave clears; touch is dismissed by outside-tap (see below).
      if (e.pointerType !== "mouse") return;
      setHoverIdx(null);
    },
    [],
  );

  // Touch / pen tap
  const handlePointerDown = useCallback(
    (e: ReactPointerEvent<SVGSVGElement>) => {
      if (e.pointerType === "mouse") return;
      const userX = clientToUserX(e.clientX);
      if (userX === null || data.length === 0) return;
      const idx = nearestPointIndex(points, userX);
      if (idx < 0) {
        setHoverIdx(null);
        return;
      }
      // Distance from finger to the actual point (in user-space units).
      const dist = Math.abs(points[idx][0] - userX);
      if (dist > TAP_HIT_RADIUS) {
        setHoverIdx(null);
        return;
      }
      // Toggle: tapping the same point closes the tooltip.
      setHoverIdx((cur) => (cur === idx ? null : idx));
    },
    [clientToUserX, data.length, points],
  );

  // Dismiss tooltip on outside tap (touch only).
  useEffect(() => {
    if (hoverIdx === null) return;
    const onDocDown = (e: PointerEvent) => {
      if (e.pointerType === "mouse") return;
      const svg = svgRef.current;
      if (!svg) return;
      if (e.target instanceof Node && svg.contains(e.target)) return;
      setHoverIdx(null);
    };
    document.addEventListener("pointerdown", onDocDown);
    return () => document.removeEventListener("pointerdown", onDocDown);
  }, [hoverIdx]);

  if (!data || data.length === 0) return null;

  const line = linePath(points);
  const area = fillPath(points, padTop + innerH);
  const zero = zeroBaseline(geom);

  const labelIdxs = Array.from(
    new Set([0, Math.floor((data.length - 1) / 2), data.length - 1]),
  );

  const [hoverPxX, hoverPxY] = (() => {
    if (hoverIdx === null) return [0, 0];
    const containerW = containerRef.current?.clientWidth ?? width;
    const [ux, uy] = points[hoverIdx];
    const scale = containerW / width;
    return [ux * scale, uy * scale];
  })();

  const containerWidth = containerRef.current?.clientWidth ?? width;

  return (
    <div
      ref={containerRef}
      style={{ position: "relative", width: "100%", ...style }}
    >
      <svg
        ref={svgRef}
        width="100%"
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="none"
        style={{
          display: "block",
          cursor: "crosshair",
          touchAction: "manipulation",
        }}
        onPointerMove={handleMove}
        onPointerLeave={handleLeave}
        onPointerDown={handlePointerDown}
      >
        <defs>
          <linearGradient id={gradId} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor={accent} stopOpacity="0.28" />
            <stop offset="100%" stopColor={accent} stopOpacity="0" />
          </linearGradient>
        </defs>

        {[0.25, 0.5, 0.75].map((p) => (
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

        {zero !== null && (
          <line
            x1={padX}
            x2={width - padX}
            y1={zero}
            y2={zero}
            stroke="var(--line-strong)"
            strokeDasharray="2 3"
          />
        )}

        <path d={area} fill={`url(#${gradId})`} />
        <path
          d={line}
          fill="none"
          stroke={accent}
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />

        {points.map(([x, y], i) => {
          const active = hoverIdx === i;
          const isLast = i === points.length - 1;
          return (
            <circle
              key={i}
              cx={x}
              cy={y}
              r={active ? 3.5 : 2}
              fill={isLast || active ? accent : "var(--bg-1)"}
              stroke={accent}
              strokeWidth={active ? 1.6 : 1.2}
            />
          );
        })}

        {hoverIdx !== null && (
          <line
            x1={points[hoverIdx][0]}
            x2={points[hoverIdx][0]}
            y1={padTop}
            y2={padTop + innerH}
            stroke={accent}
            strokeOpacity="0.35"
            strokeDasharray="2 3"
          />
        )}

        {labelIdxs.map((idx) => (
          <text
            key={idx}
            x={points[idx][0]}
            y={height - 4}
            fontSize="10"
            fill="var(--fg-3)"
            fontFamily="var(--font-mono)"
            textAnchor={
              idx === 0 ? "start" : idx === data.length - 1 ? "end" : "middle"
            }
          >
            {data[idx].x}
          </text>
        ))}
      </svg>

      {hoverIdx !== null && (
        <AreaChartTooltip
          point={data[hoverIdx]}
          x={hoverPxX}
          y={hoverPxY}
          containerWidth={containerWidth}
        />
      )}
    </div>
  );
}
