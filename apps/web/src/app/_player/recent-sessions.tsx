import Link from "next/link";
import { MoneyDisplay } from "@/components/money-display";
import { Icon } from "@/components/ui/icon";
import { SessionTypeIcon } from "@/components/ui/session-type-icon";

export type RecentSession = {
  id: string;
  participantId: string;
  title: string;
  type: "online" | "offline" | string | null | undefined;
  date: Date | null;
  net: number | null;
};

export function RecentSessions({ items }: { items: RecentSession[] }) {
  return (
    <div style={{ marginTop: 20 }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 10,
          paddingInline: 2,
        }}
      >
        <div className="pkr-section-label">Recent sessions</div>
        <Link
          href="/sessions"
          style={{
            color: "var(--fg-2)",
            fontSize: 12,
            fontWeight: 500,
            display: "inline-flex",
            alignItems: "center",
            gap: 2,
            textDecoration: "none",
          }}
        >
          See all <Icon name="chevR" size={12} />
        </Link>
      </div>

      {items.length === 0 ? (
        <div
          className="pkr-card"
          style={{
            padding: 28,
            textAlign: "center",
            color: "var(--fg-2)",
            fontSize: 13,
          }}
        >
          No sessions in this period.
        </div>
      ) : (
        <div className="pkr-card" style={{ overflow: "hidden", padding: 0 }}>
          {items.map((s, i) => (
            <Link
              key={s.participantId}
              href={`/sessions/${s.id}`}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "12px 14px",
                borderTop: i === 0 ? "none" : "0.5px solid var(--line)",
                textDecoration: "none",
                color: "inherit",
              }}
            >
              <SessionTypeIcon type={s.type} size={14} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontSize: 14,
                    fontWeight: 500,
                    color: "var(--fg-1)",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {s.title}
                </div>
                <div
                  style={{
                    fontSize: 11.5,
                    color: "var(--fg-2)",
                    marginTop: 1,
                  }}
                >
                  <span data-mono>
                    {s.date ? s.date.toLocaleDateString() : "—"}
                  </span>
                </div>
              </div>
              {s.net !== null && <MoneyDisplay value={s.net} size="md" />}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
