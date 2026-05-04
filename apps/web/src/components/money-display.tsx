import { formatMoney } from "@/lib/format";

type Size = "hero" | "lg" | "md" | "sm";

const SIZE_MAP: Record<Size, { fontSize: number; weight: number; unitSize: number }> = {
  hero: { fontSize: 44, weight: 600, unitSize: 18 },
  lg:   { fontSize: 28, weight: 600, unitSize: 14 },
  md:   { fontSize: 17, weight: 600, unitSize: 12 },
  sm:   { fontSize: 13, weight: 500, unitSize: 11 },
};

export function MoneyDisplay({
  value,
  size = "md",
  showSign = true,
  unit,
  className,
}: {
  value: number;
  size?: Size;
  showSign?: boolean;
  /** Optional currency/unit label rendered after the amount, e.g. "chips" */
  unit?: string;
  className?: string;
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
      className={className}
      style={{
        display: "inline-flex",
        alignItems: "baseline",
        gap: "0.3em",
        whiteSpace: "nowrap",
        fontSize: dims.fontSize,
        fontWeight: dims.weight,
        color,
        letterSpacing: "-0.02em",
      }}
    >
      <span>{sign}{formatted}</span>
      {unit && (
        <span
          style={{
            fontSize: dims.unitSize,
            fontWeight: 400,
            color: "var(--fg-2)",
            letterSpacing: "0.01em",
            fontFamily: "var(--font-ui)",
          }}
        >
          {unit}
        </span>
      )}
    </span>
  );
}
