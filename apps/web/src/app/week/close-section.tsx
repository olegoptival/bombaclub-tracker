import { Prisma } from "@prisma/client";
import { CloseButton, ReopenButton } from "./close-button";
import type { IsoWeek } from "./week-utils";

export type TransferRow = {
  from_nickname: string;
  to_nickname: string;
  amount: Prisma.Decimal;
};

type Props = {
  week: IsoWeek;
  isHostOrAdmin: boolean;
  isPastWeek: boolean;
  closed:
    | { closedAt: Date; transfers: TransferRow[] }
    | null;
  preview: TransferRow[]; // transfers we'd create if we close now
  pendingSessionsCount: number;
  guestCount: number;
};

export function CloseSection({
  week,
  isHostOrAdmin,
  isPastWeek,
  closed,
  preview,
  pendingSessionsCount,
  guestCount,
}: Props) {
  // ─── State A: week is CLOSED ─────────────────────────────────────────
  if (closed) {
    return (
      <div className="pkr-card" style={{ padding: 14, marginTop: 14 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 10,
          }}
        >
          <div>
            <div className="pkr-section-label">Settle-up · closed</div>
            <div style={{ fontSize: 11, color: "var(--fg-3)", marginTop: 2 }} data-mono>
              {closed.closedAt.toLocaleString("en-GB", {
                day: "numeric",
                month: "short",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
                timeZone: "UTC",
              })} UTC
            </div>
          </div>
          {isHostOrAdmin && <ReopenButton week={week} />}
        </div>
        <TransferList transfers={closed.transfers} />
      </div>
    );
  }

  // ─── State B: current week (not allowed to close yet) ────────────────
  if (!isPastWeek) {
    return (
      <div className="pkr-card" style={{ padding: 14, marginTop: 14 }}>
        <div className="pkr-section-label" style={{ marginBottom: 8 }}>
          Settle-up · preview
        </div>
        <div style={{ fontSize: 12, color: "var(--fg-2)", marginBottom: 10 }}>
          Week is still in progress. Closing becomes available once it ends.
        </div>
        <TransferList transfers={preview} />
      </div>
    );
  }

  // ─── State C: past week, not closed, host/admin sees Close button ────
  return (
    <div className="pkr-card" style={{ padding: 14, marginTop: 14 }}>
      <div className="pkr-section-label" style={{ marginBottom: 8 }}>
        Settle-up · preview
      </div>
      <TransferList transfers={preview} />

      {isHostOrAdmin && (
        <div style={{ marginTop: 12 }}>
          {pendingSessionsCount > 0 ? (
            <BlockNotice>
              Finish or cancel {pendingSessionsCount} pending session
              {pendingSessionsCount !== 1 ? "s" : ""} before closing the week.
            </BlockNotice>
          ) : guestCount > 0 ? (
            <BlockNotice>
              Convert {guestCount} guest{guestCount !== 1 ? "s" : ""} to club
              members before closing the week.
            </BlockNotice>
          ) : (
            <CloseButton week={week} />
          )}
        </div>
      )}
    </div>
  );
}

function TransferList({ transfers }: { transfers: TransferRow[] }) {
  if (transfers.length === 0) {
    return (
      <div style={{ fontSize: 13, color: "var(--fg-2)", padding: "8px 0" }}>
        Everyone breaks even — no transfers needed.
      </div>
    );
  }
  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      {transfers.map((t, i) => (
        <div
          key={i}
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "10px 0",
            borderTop: i === 0 ? "none" : "0.5px solid var(--line)",
            fontSize: 14,
          }}
        >
          <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ color: "var(--fg-2)" }}>{t.from_nickname}</span>
            <span style={{ color: "var(--fg-3)" }}>→</span>
            <span style={{ fontWeight: 500 }}>{t.to_nickname}</span>
          </span>
          <span data-mono style={{ fontWeight: 600 }}>
            {parseFloat(t.amount.toString()).toFixed(2)}
          </span>
        </div>
      ))}
    </div>
  );
}

function BlockNotice({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        padding: "10px 12px",
        borderRadius: "var(--r-md, 10px)",
        background: "rgba(217,117,101,0.10)",
        color: "var(--neg)",
        fontSize: 13,
        fontWeight: 500,
      }}
    >
      {children}
    </div>
  );
}
