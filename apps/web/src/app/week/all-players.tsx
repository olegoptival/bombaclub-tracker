import { Prisma } from "@prisma/client";
import { type IsoWeek, formatWeekParam } from "./week-utils";

type PlayerRow = {
  member_id: string;
  nickname: string;
  pnl: Prisma.Decimal;
  sessions_count: number;
};

type Props = {
  clubId: string;
  week: IsoWeek;
  rows: PlayerRow[];
};

export function AllPlayers({ clubId, week, rows }: Props) {
  const weekStr = formatWeekParam(week);
  const shareUrl = `/api/weeks/${clubId}/${weekStr}/og`;

  return (
    <div className="pkr-card" style={{ padding: 14 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 8,
        }}
      >
        <div className="pkr-section-label">
          All players · {rows.length}
        </div>
        {rows.length > 0 && (
          <a
            href={shareUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="pkr-btn pkr-btn--ghost pkr-btn--sm"
            style={{ height: 28 }}
          >
            Share image
          </a>
        )}
      </div>

      {rows.length === 0 ? (
        <div style={{ fontSize: 13, color: "var(--fg-2)", padding: "8px 0" }}>
          No online sessions this week.
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column" }}>
          {rows.map((r, i) => {
            const num = parseFloat(r.pnl.toString());
            const color = num > 0 ? "var(--pos)" : num < 0 ? "var(--neg)" : "var(--fg-1)";
            const sign = num > 0 ? "+" : num < 0 ? "−" : "";
            return (
              <div
                key={r.member_id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "10px 0",
                  borderTop: i === 0 ? "none" : "0.5px solid var(--line)",
                }}
              >
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 500 }}>{r.nickname}</div>
                  <div style={{ fontSize: 11, color: "var(--fg-2)", marginTop: 2 }}>
                    {r.sessions_count} session{r.sessions_count !== 1 ? "s" : ""}
                  </div>
                </div>
                <span data-mono style={{ fontSize: 15, fontWeight: 600, color }}>
                  {sign}{Math.abs(num).toFixed(2)}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
