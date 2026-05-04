import { formatMoney } from "@/lib/format";

export type MoneySize = "hero" | "big" | "lg" | "medium" | "md" | "small" | "sm" | "inline";

type SizeSpec = {
  fontSize: number | "inherit";
  lineHeight: number | "inherit";
  fontWeight: number;
  letterSpacing: string;
};

const SIZE_MAP: Record<MoneySize, SizeSpec> = {
  hero:   { fontSize: 56,        lineHeight: 1.0,       fontWeight: 500, letterSpacing: "-0.03em"  },
  big:    { fontSize: 36,        lineHeight: 1.05,      fontWeight: 500, letterSpacing: "-0.025em" },
  lg:     { fontSize: 28,        lineHeight: 1.1,       fontWeight: 500, letterSpacing: "-0.02em"  },
  medium: { fontSize: 16,        lineHeight: 1.2,       fontWeight: 500, letterSpacing: "-0.01em"  },
  md:     { fontSize: 16,        lineHeight: 1.2,       fontWeight: 500, letterSpacing: "-0.01em"  },
  small:  { fontSize: 13,        lineHeight: 1.2,       fontWeight: 500, letterSpacing: "-0.005em" },
  sm:     { fontSize: 13,        lineHeight: 1.2,       fontWeight: 500, letterSpacing: "-0.005em" },
  inline: { fontSize: "inherit", lineHeight: "inherit", fontWeight: 500, letterSpacing: "0"        },
};

export function MoneyDisplay({
  value,
  size = "medium",
  showSign = true,
  showZeroSign = false,
  mute = false,
  forceColor,
  unit,
  className,
}: {
  value: number;
  size?: MoneySize;
  showSign?: boolean;
  /** Show ± on zero values */
  showZeroSign?: boolean;
  /** Render in fg-1 regardless of sign */
  mute?: boolean;
  forceColor?: string;
  /** Optional unit suffix, e.g. "chips" — not rendered for inline size */
  unit?: string;
  className?: string;
}) {
  const isPos = value > 0;
  const isNeg = value < 0;

  let color: string;
  if (forceColor) {
    color = forceColor;
  } else if (mute) {
    color = "var(--fg-1)";
  } else if (isPos) {
    color = "var(--pos)";
  } else if (isNeg) {
    color = "var(--neg)";
  } else {
    color = "var(--fg-1)";
  }

  const dims = SIZE_MAP[size];

  let sign = "";
  if (showSign) {
    if (isPos) sign = "+";
    else if (isNeg) sign = "−";
    else if (showZeroSign) sign = "±";
  }

  const formatted = formatMoney(Math.abs(value));

  const unitSize =
    typeof dims.fontSize === "number"
      ? Math.round(dims.fontSize * 0.6)
      : undefined;

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
        lineHeight: dims.lineHeight,
        fontWeight: dims.fontWeight,
        color,
        letterSpacing: dims.letterSpacing,
        fontFamily: "var(--font-mono)",
        fontVariantNumeric: "tabular-nums",
      }}
    >
      <span>{sign}{formatted}</span>
      {unit && size !== "inline" && (
        <span
          style={{
            fontSize: unitSize,
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
