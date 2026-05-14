import Link from "next/link";
import { type IsoWeek, formatWeekParam } from "./week-utils";

type Props = {
  week: IsoWeek;
  view: "mine" | "all";
};

export function ViewToggle({ week, view }: Props) {
  const weekStr = formatWeekParam(week);
  const mineHref = `/week?week=${weekStr}`;
  const allHref = `/week?week=${weekStr}&view=all`;

  const base = {
    flex: 1,
    height: 36,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 13,
    fontWeight: 500,
    textDecoration: "none",
    borderRadius: 8,
    transition: "all 120ms ease",
  } as const;

  const active = {
    background: "var(--bg-3)",
    color: "var(--fg-0)",
  } as const;

  const inactive = {
    color: "var(--fg-2)",
  } as const;

  return (
    <div
      style={{
        display: "flex",
        gap: 4,
        padding: 4,
        marginBottom: 14,
        background: "var(--bg-2)",
        borderRadius: 10,
        border: "0.5px solid var(--line)",
      }}
    >
      <Link href={mineHref} style={{ ...base, ...(view === "mine" ? active : inactive) }}>
        My week
      </Link>
      <Link href={allHref} style={{ ...base, ...(view === "all" ? active : inactive) }}>
        All players
      </Link>
    </div>
  );
}
