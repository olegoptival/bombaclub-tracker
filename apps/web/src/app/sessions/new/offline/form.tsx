"use client";

import { useActionState, useState } from "react";
import { createOfflineSessionAction, type CreateOfflineState } from "./actions";

const GAME_TYPES = ["NLH", "PLO", "PLO5", "Other"] as const;
const initial: CreateOfflineState = {};

type CoHost = { id: string; name: string };

export function OfflineSetupForm({
  clubId,
  coHosts,
}: {
  clubId: string;
  coHosts: CoHost[];
}) {
  const [state, action, pending] = useActionState(createOfflineSessionAction, initial);
  const [gameType, setGameType] = useState<(typeof GAME_TYPES)[number]>("NLH");

  return (
    <form action={action} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <input type="hidden" name="club_id" value={clubId} />
      <input type="hidden" name="game_type" value={gameType} />

      <div>
        <div className="pkr-label">Game type</div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {GAME_TYPES.map((g) => {
            const on = gameType === g;
            return (
              <button
                key={g}
                type="button"
                onClick={() => setGameType(g)}
                style={{
                  padding: "8px 14px",
                  borderRadius: 999,
                  background: on ? "var(--accent-soft)" : "var(--bg-2)",
                  color: on ? "var(--accent-hi)" : "var(--fg-1)",
                  border: "none",
                  cursor: "pointer",
                  fontSize: 13,
                  fontWeight: 500,
                  boxShadow: on
                    ? "0 0 0 0.5px var(--accent-ring) inset"
                    : "0 0 0 0.5px var(--line) inset",
                }}
              >
                {g}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <label htmlFor="blinds" className="pkr-label">Blinds</label>
        <input id="blinds" name="blinds" type="text" placeholder="1/2" className="pkr-input" />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <div>
          <label htmlFor="buy_in_min" className="pkr-label">Buy-in min</label>
          <input
            id="buy_in_min"
            name="buy_in_min"
            type="number"
            step="0.01"
            min="0"
            className="pkr-input"
            placeholder="100"
          />
        </div>
        <div>
          <label htmlFor="buy_in_max" className="pkr-label">Buy-in max</label>
          <input
            id="buy_in_max"
            name="buy_in_max"
            type="number"
            step="0.01"
            min="0"
            className="pkr-input"
            placeholder="600"
          />
        </div>
      </div>

      <div>
        <label htmlFor="title" className="pkr-label">Title (optional)</label>
        <input
          id="title"
          name="title"
          type="text"
          className="pkr-input"
          placeholder="Late Night Felt"
        />
      </div>

      {coHosts.length > 0 && (
        <div>
          <label htmlFor="co_host_id" className="pkr-label">Co-host (optional)</label>
          <select id="co_host_id" name="co_host_id" defaultValue="" className="pkr-input">
            <option value="">— none —</option>
            {coHosts.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {state.error && <div className="pkr-error">{state.error}</div>}

      <button
        type="submit"
        disabled={pending}
        className="pkr-btn pkr-btn--primary pkr-btn--block"
        style={{ height: 50, fontSize: 15.5, marginTop: 6 }}
      >
        {pending ? "Starting…" : "Start session"}
      </button>
    </form>
  );
}
