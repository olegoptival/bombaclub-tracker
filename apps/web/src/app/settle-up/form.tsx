"use client";

import { useActionState } from "react";
import { closeSettleUpAction, type CloseSettleState } from "./actions";

const initial: CloseSettleState = {};

export function SettleUpForm({
  clubId,
  today,
  canSubmit,
  sumOff,
  balancesEmpty,
}: {
  clubId: string;
  today: string;
  canSubmit: boolean;
  sumOff: number;
  balancesEmpty: boolean;
}) {
  const [state, action, pending] = useActionState(closeSettleUpAction, initial);

  let blockMessage: string | null = null;
  if (balancesEmpty) blockMessage = "All balances are already zero — nothing to settle.";
  else if (Math.abs(sumOff) > 0.01)
    blockMessage = `Balances do not sum to zero (off by ${sumOff.toFixed(2)}). Cannot settle.`;

  return (
    <form action={action} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <input type="hidden" name="club_id" value={clubId} />

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <div>
          <label htmlFor="period_start" className="pkr-label">From</label>
          <input
            id="period_start"
            name="period_start"
            type="date"
            defaultValue={today}
            required
            className="pkr-input"
          />
        </div>
        <div>
          <label htmlFor="period_end" className="pkr-label">To</label>
          <input
            id="period_end"
            name="period_end"
            type="date"
            defaultValue={today}
            required
            className="pkr-input"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={pending || !canSubmit || !!blockMessage}
        className="pkr-btn pkr-btn--primary pkr-btn--block"
        style={{ height: 48 }}
      >
        {pending ? "Saving…" : "Confirm settle-up"}
      </button>

      {blockMessage && <div className="pkr-help" style={{ textAlign: "center" }}>{blockMessage}</div>}
      {state.error && <div className="pkr-error">{state.error}</div>}
      {state.success && (
        <div
          style={{
            fontSize: 12.5,
            color: "var(--pos)",
            background: "var(--pos-soft)",
            padding: "8px 12px",
            borderRadius: "var(--r-sm)",
            textAlign: "center",
          }}
        >
          {state.success}
        </div>
      )}
    </form>
  );
}
