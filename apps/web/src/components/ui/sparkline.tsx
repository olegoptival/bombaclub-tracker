export function Sparkline({
  data,
  width = 120,
  height = 32,
  stroke = "var(--accent)",
  fill = "var(--accent-soft)",
  showFill = true,
}: {
  data: { value: number }[];
  width?: number;
  height?: number;
  stroke?: string;
  fill?: string;
  showFill?: boolean;
}) {
  if (!data.length) return null;

  const vals = data.map((d) => d.value);
  const min = Math.min(...vals);
  const max = Math.max(...vals);
  const range = max - min || 1;
  const stepX = data.length > 1 ? width / (data.length - 1) : width;
  const pad = 2;

  const points = data.map((d, i) => {
    const x = i * stepX;
    const y = pad + (1 - (d.value - min) / range) * (height - pad * 2);
    return [x, y] as [number, number];
  });

  const linePath = points
    .map(([x, y], i) => (i === 0 ? `M${x},${y}` : `L${x},${y}`))
    .join(" ");

  const fillPath = `${linePath} L${width},${height} L0,${height} Z`;

  const last = points[points.length - 1]!;

  return (
    <svg width={width} height={height} style={{ display: "block" }}>
      {showFill && <path d={fillPath} fill={fill} />}
      <path
        d={linePath}
        fill="none"
        stroke={stroke}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx={last[0]} cy={last[1]} r={2.5} fill={stroke} />
    </svg>
  );
}
