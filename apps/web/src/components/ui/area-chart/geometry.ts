import type { AreaChartPoint } from "./types";

export type Geometry = {
  width: number;
  height: number;
  padX: number;
  padTop: number;
  padBottom: number;
  innerW: number;
  innerH: number;
  points: ReadonlyArray<readonly [number, number]>;
  min: number;
  max: number;
  range: number;
};

export function computeGeometry(
  data: AreaChartPoint[],
  width: number,
  height: number,
  padX = 4,
  padTop = 8,
  padBottom = 18,
): Geometry {
  const vals = data.map((d) => d.value);
  const min = Math.min(...vals);
  const max = Math.max(...vals);
  const range = max - min || 1;
  const innerW = width - padX * 2;
  const innerH = height - padTop - padBottom;
  const stepX = data.length > 1 ? innerW / (data.length - 1) : innerW;
  const points = data.map((d, i) => {
    const x = padX + i * stepX;
    const y = padTop + (1 - (d.value - min) / range) * innerH;
    return [x, y] as const;
  });
  return { width, height, padX, padTop, padBottom, innerW, innerH, points, min, max, range };
}

export function linePath(points: ReadonlyArray<readonly [number, number]>): string {
  return points
    .map(([x, y], i) => (i === 0 ? `M${x},${y}` : `L${x},${y}`))
    .join(" ");
}

export function fillPath(
  points: ReadonlyArray<readonly [number, number]>,
  baselineY: number,
): string {
  if (points.length === 0) return "";
  const line = linePath(points);
  const last = points[points.length - 1];
  const first = points[0];
  return `${line} L${last[0]},${baselineY} L${first[0]},${baselineY} Z`;
}

export function zeroBaseline(geometry: Geometry): number | null {
  const { min, max, range, padTop, innerH } = geometry;
  if (min > 0 || max < 0) return null;
  return padTop + (1 - (0 - min) / range) * innerH;
}

/**
 * Find the index of the point whose X coordinate is closest to `userX`.
 * `userX` is in the SVG's user-space (same coordinate system as `points`).
 */
export function nearestPointIndex(
  points: ReadonlyArray<readonly [number, number]>,
  userX: number,
): number {
  if (points.length === 0) return -1;
  let bestIdx = 0;
  let bestDist = Infinity;
  for (let i = 0; i < points.length; i++) {
    const dx = Math.abs(points[i][0] - userX);
    if (dx < bestDist) {
      bestDist = dx;
      bestIdx = i;
    }
  }
  return bestIdx;
}
