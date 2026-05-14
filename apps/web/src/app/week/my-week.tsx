import Link from "next/link";
import { Prisma } from "@prisma/client";

type SessionRow = {
  id: string;
  started_at: Date | null;
  ended_at: Date | null;
  title: string | null;
  pnl: Prisma.Decimal;
};

type Props = {
  totalPnl: Prisma.Decimal;
  sessionsCount: number;
  sessions: SessionRow[];
};

export function MyWeek({ totalPnl, sessionsCount, sessions }: Props) {
  const num = parseFloat(totalPnl.toString());
  const color = num > 0 ? "var(--pos)" : num < 0 ? "var(--neg)" : "var(--fg-1)";
  const sign = num > 0 ? "+" : num < 0 ? "−" : "";

  return (
    <>
      <div className="pkr-card" style={{ padding: 20, marginBottom: 14 }}>
        <div className="pkr-section-label" style={{ marginBottom: 6 }}>Your week</div>
        <div data-mono style={{ fontSize: 40, fontWeight: 600, color, letterSpacing: "-0.02em" }}>
          {sign}{Math.abs(num).toFixed(2)}
        </div>
        <div style={{ fontSize: 12, color: "var(--fg-2)", marginTop: 4 }}>
          {sessionsCount} online session{sessionsCount !== 1 ? "s" : ""}
        </div>
      </div>

      <div className="pkr-card" style={{ padding: 14 }}>
        <div className="pkr-section-label" style={{ marginBottom: 8 }}>Sessions</div>
        {sessions.length === 0 ? (
          <div style={{ fontSize: 13, color: "var(--fg-2)", padding: "8px 0" }}>
            No online sessions this week.
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column" }}>
            {sessions.map((s, i) => {
              const sNum = parseFloat(s.pnl.toString());
              const sColor = sNum > 0 ? "var(--pos)" : sNum < 0 ? "var(--neg)" : "var(--fg-1)";
              const sSign = sNum > 0 ? "+" : sNum < 0 ? "−" : "";
              const date = s.started_at ?? s.ended_at;
              return (
                <Link
                  key={s.id}
                  href={`/sessions/${s.id}`}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "10px 0",
                    borderTop: i === 0 ? "none" : "0.5px solid var(--line)",
                    textDecoration: "none",
                    color: "inherit",
                  }}
                >
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 500 }}>
                      {s.title ?? "Online session"}
                    </div>
                    {date && (
                      <div style={{ fontSize: 11, color: "var(--fg-2)", marginTop: 2 }} data-mono>
                        {new Date(date).toLocaleString("en-GB", {
                          weekday: "short",
                          day: "numeric",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                          timeZone: "UTC",
                        })} UTC
                      </div>
                    )}
                  </div>
                  <span data-mono style={{ fontSize: 15, fontWeight: 600, color: sColor }}>
                    {sSign}{Math.abs(sNum).toFixed(2)}
                  </span>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
