import { formatMoney } from "@/lib/format";

type Size = "hero" | "lg" | "md" | "sm";

const SIZE_MAP: Record<Size, { fontSize: number; weight: number }> = {
  hero: { fontSize: 44, weight: 600 },
  lg: { fontSize: 28, weight: 600 },
  md: { fontSize: 16, weight: 600 },
  sm: { fontSize: 13, weight: 500 },
};

export function MoneyDisplay({
  value,
  size = "md",
  showSign = true,
}: {
  value: number;
  size?: Size;
  showSign?: boolean;
}) {
  const isPos = value > 0;
  const isNeg = value < 0;
  const color = isPos ? "var(--pos)" : isNeg ? "var(--neg)" : "var(--neutral)";
  const dims = SIZE_MAP[size];

  const sign = showSign ? (isPos ? "+" : isNeg ? "−" : "") : "";
  const formatted = formatMoney(Math.abs(value));

  return (
    <span
      data-mono
      style={{
        fontSize: dims.fontSize,
        fontWeight: dims.weight,
        color,
        letterSpacing: "-0.02em",
        whiteSpace: "nowrap",
      }}
    >
      {sign}
      {formatted}
    </span>
  );
}
