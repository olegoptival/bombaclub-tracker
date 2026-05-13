import { MoneyDisplay } from "@/components/money-display";
import { SessionTypeIcon } from "@/components/ui/session-type-icon";

function relativeDay(d: Date): string {
  const today = new Date();
  const sameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  if (sameDay(d, today)) return "Today";
  if (sameDay(d, yesterday)) return "Yesterday";
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export function LastSessionCallout({
  type,
  title,
  date,
  pnl,
}: {
  type: "online" | "offline" | string | null | undefined;
  title: string;
  date: Date | null;
  pnl: number | null;
}) {
  return (
    <div
      style={{
        marginTop: 12,
        padding: "10px 12px",
        background: "var(--bg-2)",
        borderRadius: 10,
        display: "flex",
        alignItems: "center",
        gap: 10,
        boxShadow: "0 0 0 0.5px var(--line) inset",
      }}
    >
      <SessionTypeIcon type={type} size={12} />
      <div
        style={{ flex: 1, minWidth: 0, fontSize: 12.5, color: "var(--fg-2)" }}
      >
        {date ? relativeDay(date) : "Recent"} at{" "}
        <span style={{ color: "var(--fg-1)" }}>{title}</span>
      </div>
      {pnl !== null && <MoneyDisplay value={pnl} size="md" />}
    </div>
  );
}
