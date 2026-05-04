"use client";

import { useActionState, useState } from "react";
import { createClubAction, type CreateClubState } from "./actions";

const initial: CreateClubState = {};

export function CreateClubForm() {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(createClubAction, initial);

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="pkr-btn pkr-btn--primary"
      >
        + New club
      </button>
    );
  }

  return (
    <div className="pkr-card" style={{ padding: 18 }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 12,
        }}
      >
        <h2 style={{ fontSize: 15, fontWeight: 600 }}>Create club</h2>
        <button
          onClick={() => setOpen(false)}
          className="pkr-btn pkr-btn--ghost pkr-btn--sm"
        >
          Cancel
        </button>
      </div>

      <form
        action={formAction}
        style={{ display: "flex", flexDirection: "column", gap: 12 }}
      >
        <div>
          <label htmlFor="name" className="pkr-label">Name</label>
          <input
            id="name"
            name="name"
            type="text"
            required
            className="pkr-input"
            placeholder="Late Night Felt"
          />
        </div>

        <div>
          <label htmlFor="slug" className="pkr-label">Slug (optional)</label>
          <input
            id="slug"
            name="slug"
            type="text"
            className="pkr-input"
            placeholder="auto-generated from name"
          />
          <div className="pkr-help">URL-friendly id. Lowercase letters, digits and dashes only.</div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div>
            <label htmlFor="settlement_period" className="pkr-label">
              Settle period
            </label>
            <select
              id="settlement_period"
              name="settlement_period"
              defaultValue="month"
              className="pkr-input"
            >
              <option value="day">Daily</option>
              <option value="week">Weekly</option>
              <option value="month">Monthly</option>
              <option value="manual">Manual</option>
            </select>
          </div>
          <div>
            <label htmlFor="dispute_window_days" className="pkr-label">
              Dispute window (days)
            </label>
            <input
              id="dispute_window_days"
              name="dispute_window_days"
              type="number"
              min={0}
              max={60}
              defaultValue={7}
              required
              className="pkr-input"
            />
          </div>
        </div>

        <div>
          <label htmlFor="required_aliases" className="pkr-label">
            Required platforms
          </label>
          <input
            id="required_aliases"
            name="required_aliases"
            type="text"
            defaultValue="ClubGG"
            required
            className="pkr-input"
            placeholder="ClubGG, PPPoker"
          />
          <div className="pkr-help">Comma-separated. These are the platforms each member must provide an alias for.</div>
        </div>

        {state.error && <div className="pkr-error">{state.error}</div>}
        {state.success && (
          <div
            style={{
              fontSize: 12.5,
              color: "var(--pos)",
              background: "var(--pos-soft)",
              padding: "8px 12px",
              borderRadius: "var(--r-sm)",
            }}
          >
            {state.success}
          </div>
        )}

        <button
          type="submit"
          disabled={pending}
          className="pkr-btn pkr-btn--primary"
          style={{ marginTop: 4 }}
        >
          {pending ? "Creating…" : "Create club"}
        </button>
      </form>
    </div>
  );
}
