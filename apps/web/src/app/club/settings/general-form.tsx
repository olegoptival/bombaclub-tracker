"use client";

import { useActionState } from "react";
import { updateClubGeneralAction, type ClubActionState } from "./actions";

type Props = {
  initial: {
    name: string;
    settlement_period: string;
    dispute_window_days: number;
    required_aliases: string[];
  };
};

const initialState: ClubActionState = {};

export function GeneralForm({ initial }: Props) {
  const [state, action, pending] = useActionState(
    updateClubGeneralAction,
    initialState
  );

  return (
    <form action={action} className="pkr-card" style={{ padding: 16, marginBottom: 14 }}>
      <div className="pkr-section-label" style={{ marginBottom: 12 }}>
        General
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <label className="pkr-label" htmlFor="name">
          Name
          <input
            id="name"
            name="name"
            type="text"
            defaultValue={initial.name}
            required
            className="pkr-input"
          />
        </label>

        <div style={{ display: "flex", gap: 12 }}>
          <label className="pkr-label" htmlFor="settlement_period" style={{ flex: 1 }}>
            Settle period
            <select
              id="settlement_period"
              name="settlement_period"
              defaultValue={initial.settlement_period}
              className="pkr-input"
            >
              <option value="day">Daily</option>
              <option value="week">Weekly</option>
              <option value="month">Monthly</option>
              <option value="manual">Manual</option>
            </select>
          </label>

          <label className="pkr-label" htmlFor="dispute_window_days" style={{ flex: 1 }}>
            Dispute window (days)
            <input
              id="dispute_window_days"
              name="dispute_window_days"
              type="number"
              min={1}
              max={90}
              defaultValue={initial.dispute_window_days}
              required
              className="pkr-input"
            />
          </label>
        </div>

        <label className="pkr-label" htmlFor="required_aliases">
          Required platforms
          <input
            id="required_aliases"
            name="required_aliases"
            type="text"
            defaultValue={initial.required_aliases.join(", ")}
            placeholder="ClubGG, PokerBros"
            className="pkr-input"
          />
          <span style={{ fontSize: 11, color: "var(--fg-3)", marginTop: 4, display: "block" }}>
            Comma-separated. Each member must provide an alias for these.
          </span>
        </label>
      </div>

      <div style={{ marginTop: 14, display: "flex", justifyContent: "flex-end", alignItems: "center", gap: 10 }}>
        {state.error && <span className="pkr-error">{state.error}</span>}
        {state.success && (
          <span style={{ fontSize: 12, color: "var(--pos)" }}>{state.success}</span>
        )}
        <button
          type="submit"
          disabled={pending}
          className="pkr-btn pkr-btn--primary pkr-btn--sm"
        >
          {pending ? "Saving…" : "Save"}
        </button>
      </div>
    </form>
  );
}
