"use client";

import { useActionState } from "react";
import { finalizeSessionAction, type FinalizeState } from "./actions";

type Row = {
  id: string;
  name: string;
  is_guest: boolean;
  total: string;
};

const initial: FinalizeState = {};

export function ReviewForm({
  sessionId,
  rows,
  sumOff,
}: {
  sessionId: string;
  rows: Row[];
  sumOff: string;
}) {
  const [state, action, pending] = useActionState(finalizeSessionAction, initial);

  const sumNum = parseFloat(sumOff);
  const abs = Math.abs(sumNum);
  let badge: { label: string; bg: string; fg: string };
  if (abs <= 0.01) badge = { label: "Sums to 0 ✓", bg: "var(--pos-soft)", fg: "var(--pos)" };
  else if (abs <= 1) badge = { label: `Sum off ${sumNum.toFixed(2)} (rounding)`, bg: "var(--accent-soft)", fg: "var(--accent-hi)" };
  else if (abs <= 10) badge = { label: `Sum off ${sumNum.toFixed(2)} — verify`, bg: "rgba(217,117,101,0.10)", fg: "var(--neg)" };
  else badge = { label: `Sum off ${sumNum.toFixed(2)} — cannot save`, bg: "rgba(217,117,101,0.20)", fg: "var(--neg)" };

  const blocked = abs > 10;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div className="pkr-card" style={{ padding: 14 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
          {rows.map((r, idx) => {
            const total = parseFloat(r.total);
            const color = total > 0 ? "var(--pos)" : total < 0 ? "var(--neg)" : "var(--fg-1)";
            return (
              <div
                key={r.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "10px 0",
                  borderTop: idx === 0 ? "none" : "0.5px solid var(--line)",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 14, fontWeight: 500 }}>{r.name}</span>
                  {r.is_guest && (
                    <span
                      style={{
                        padding: "1px 6px",
                        fontSize: 9.5,
                        fontWeight: 600,
                        textTransform: "uppercase",
                        letterSpacing: 0.04,
                        background: "var(--bg-3)",
                        color: "var(--fg-2)",
                        borderRadius: 999,
                      }}
                    >
                      Guest
                    </span>
                  )}
                </div>
                <span data-mono style={{ fontSize: 15, fontWeight: 600, color }}>
                  {total > 0 ? "+" : total < 0 ? "−" : ""}
                  {Math.abs(total).toFixed(2)}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <div
        style={{
          padding: "10px 14px",
          borderRadius: "var(--r-md)",
          background: badge.bg,
          color: badge.fg,
          fontSize: 13,
          fontWeight: 600,
          textAlign: "center",
        }}
      >
        {badge.label}
      </div>

      <form action={action}>
        <input type="hidden" name="sessionId" value={sessionId} />
        <button
          type="submit"
          disabled={pending || blocked}
          className="pkr-btn pkr-btn--primary pkr-btn--block"
          style={{ height: 50, fontSize: 15.5 }}
        >
          {pending ? "Saving…" : "Save session and update balances"}
        </button>
      </form>

      {state.error && <div className="pkr-error">{state.error}</div>}
    </div>
  );
}
