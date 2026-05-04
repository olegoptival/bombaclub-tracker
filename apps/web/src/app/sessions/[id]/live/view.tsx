"use client";

import { useActionState, useEffect, useState } from "react";
import {
  addPlayerAction,
  rebuyAction,
  cashOutAction,
  undoLastAction,
  endSessionAction,
  type ActionState,
} from "./actions";

type Row = {
  id: string;
  name: string;
  isGuest: boolean;
  totalBuyIn: string;
  buyInCount: number;
  cashedOut: boolean;
  stack: string | null;
  pnl: string | null;
};

type Member = { id: string; nickname: string };

const initial: ActionState = {};

function elapsedString(startedAt: string | null) {
  if (!startedAt) return "—";
  const ms = Date.now() - new Date(startedAt).getTime();
  const totalMin = Math.floor(ms / 60000);
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

export function LiveView({
  sessionId,
  titleLine,
  title,
  startedAt,
  seated,
  cashedOut,
  totalChips,
  availableMembers,
  defaultBuyIn,
}: {
  sessionId: string;
  titleLine: string;
  title: string | null;
  startedAt: string | null;
  seated: Row[];
  cashedOut: Row[];
  totalChips: string;
  availableMembers: Member[];
  defaultBuyIn: string;
}) {
  const [elapsed, setElapsed] = useState(elapsedString(startedAt));
  useEffect(() => {
    const id = setInterval(() => setElapsed(elapsedString(startedAt)), 60000);
    return () => clearInterval(id);
  }, [startedAt]);

  const [openAdd, setOpenAdd] = useState(false);
  const [busy, setBusy] = useState(false);

  return (
    <main style={{ minHeight: "100vh", paddingBottom: 100 }}>
      {/* Sticky header */}
      <header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 10,
          background: "var(--bg-0)",
          borderBottom: "0.5px solid var(--line)",
          padding: "12px 16px",
        }}
      >
        <div style={{ maxWidth: 460, marginInline: "auto" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
            <div>
              <div style={{ fontSize: 15, fontWeight: 600 }}>{title ?? titleLine}</div>
              <div style={{ fontSize: 11.5, color: "var(--fg-2)", marginTop: 2 }}>
                {title ? titleLine : "Live"} · Open {elapsed}
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div className="pkr-section-label">On the table</div>
              <div data-mono style={{ fontSize: 18, fontWeight: 600, color: "var(--accent-hi)" }}>
                {totalChips}
              </div>
            </div>
          </div>
          <div style={{ fontSize: 11.5, color: "var(--fg-2)", marginTop: 4 }}>
            {seated.length} seated · {cashedOut.length} cashed out
          </div>
        </div>
      </header>

      <div style={{ maxWidth: 460, marginInline: "auto", padding: "16px" }}>
        {/* AT THE TABLE */}
        <section style={{ marginBottom: 18 }}>
          <div className="pkr-section-label" style={{ marginBottom: 10, paddingInline: 4 }}>
            At the table · {seated.length}
          </div>
          {seated.length === 0 ? (
            <div
              className="pkr-card"
              style={{ padding: 20, textAlign: "center", color: "var(--fg-2)", fontSize: 13 }}
            >
              No players seated yet.
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {seated.map((r) => (
                <SeatedRow key={r.id} row={r} sessionId={sessionId} defaultBuyIn={defaultBuyIn} />
              ))}
            </div>
          )}
        </section>

        {/* CASHED OUT */}
        {cashedOut.length > 0 && (
          <section style={{ marginBottom: 18 }}>
            <div className="pkr-section-label" style={{ marginBottom: 10, paddingInline: 4 }}>
              Cashed out · {cashedOut.length}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {cashedOut.map((r) => (
                <CashedOutRow key={r.id} row={r} />
              ))}
            </div>
          </section>
        )}

        {/* Add player */}
        {!openAdd ? (
          <button
            type="button"
            onClick={() => setOpenAdd(true)}
            className="pkr-btn pkr-btn--primary pkr-btn--block"
            style={{ marginTop: 12 }}
          >
            + Add player
          </button>
        ) : (
          <AddPlayerCard
            sessionId={sessionId}
            availableMembers={availableMembers}
            defaultBuyIn={defaultBuyIn}
            onClose={() => setOpenAdd(false)}
          />
        )}

        {/* Actions row */}
        <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
          <UndoButton sessionId={sessionId} disabled={busy} />
          <EndSessionButton sessionId={sessionId} disabled={busy} setBusy={setBusy} />
        </div>
      </div>
    </main>
  );
}

function SeatedRow({
  row,
  sessionId,
  defaultBuyIn,
}: {
  row: Row;
  sessionId: string;
  defaultBuyIn: string;
}) {
  const [mode, setMode] = useState<"idle" | "rebuy" | "cashout">("idle");

  return (
    <div className="pkr-card" style={{ padding: 14 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 15, fontWeight: 600 }}>{row.name}</span>
            {row.isGuest && (
              <span
                style={{
                  padding: "1px 6px",
                  fontSize: 9.5,
                  fontWeight: 600,
                  textTransform: "uppercase",
                  background: "var(--bg-3)",
                  color: "var(--fg-2)",
                  borderRadius: 999,
                }}
              >
                Guest
              </span>
            )}
          </div>
          <div style={{ fontSize: 11.5, color: "var(--fg-2)", marginTop: 2 }}>
            <span data-mono>{row.totalBuyIn}</span> in · {row.buyInCount} buy-in{row.buyInCount !== 1 ? "s" : ""}
          </div>
        </div>
        {mode === "idle" && (
          <div style={{ display: "flex", gap: 6 }}>
            <button
              type="button"
              onClick={() => setMode("rebuy")}
              className="pkr-btn pkr-btn--ghost pkr-btn--sm"
            >
              Rebuy
            </button>
            <button
              type="button"
              onClick={() => setMode("cashout")}
              className="pkr-btn pkr-btn--primary pkr-btn--sm"
            >
              Cash out
            </button>
          </div>
        )}
      </div>

      {mode === "rebuy" && (
        <RebuyForm
          sessionId={sessionId}
          participantId={row.id}
          defaultBuyIn={defaultBuyIn}
          onClose={() => setMode("idle")}
        />
      )}
      {mode === "cashout" && (
        <CashOutForm
          sessionId={sessionId}
          participantId={row.id}
          onClose={() => setMode("idle")}
        />
      )}
    </div>
  );
}

function CashedOutRow({ row }: { row: Row }) {
  const pnlNum = row.pnl ? parseFloat(row.pnl) : 0;
  const color = pnlNum > 0 ? "var(--pos)" : pnlNum < 0 ? "var(--neg)" : "var(--fg-1)";
  return (
    <div
      className="pkr-card"
      style={{ padding: 12, display: "flex", justifyContent: "space-between", alignItems: "center" }}
    >
      <div>
        <div style={{ fontSize: 14, fontWeight: 500 }}>{row.name}</div>
        <div style={{ fontSize: 11, color: "var(--fg-2)", marginTop: 2 }}>
          <span data-mono>{row.totalBuyIn}</span> in · <span data-mono>{row.stack}</span> out
        </div>
      </div>
      <span data-mono style={{ fontSize: 15, fontWeight: 600, color }}>
        {pnlNum > 0 ? "+" : pnlNum < 0 ? "−" : ""}
        {Math.abs(pnlNum).toFixed(2)}
      </span>
    </div>
  );
}

function AddPlayerCard({
  sessionId,
  availableMembers,
  defaultBuyIn,
  onClose,
}: {
  sessionId: string;
  availableMembers: Member[];
  defaultBuyIn: string;
  onClose: () => void;
}) {
  const [state, action, pending] = useActionState(addPlayerAction, initial);
  const [kind, setKind] = useState<"member" | "guest">("member");

  // Close on success
  useEffect(() => {
    if (!state.error && !pending) {
      // No reliable success flag — just leave it; user reopens via + Add player
    }
  }, [state, pending]);

  return (
    <form
      action={action}
      className="pkr-card"
      style={{ padding: 14, marginTop: 12, display: "flex", flexDirection: "column", gap: 12 }}
    >
      <input type="hidden" name="session_id" value={sessionId} />
      <input type="hidden" name="kind" value={kind} />
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h3 style={{ fontSize: 14, fontWeight: 600 }}>Add player</h3>
        <button
          type="button"
          onClick={onClose}
          className="pkr-btn pkr-btn--ghost pkr-btn--sm"
        >
          Cancel
        </button>
      </div>

      <div style={{ display: "flex", gap: 6 }}>
        <button
          type="button"
          onClick={() => setKind("member")}
          style={{
            flex: 1,
            padding: "8px 10px",
            borderRadius: 999,
            background: kind === "member" ? "var(--accent-soft)" : "var(--bg-2)",
            color: kind === "member" ? "var(--accent-hi)" : "var(--fg-1)",
            border: "none",
            cursor: "pointer",
            fontSize: 13,
            fontWeight: 500,
          }}
        >
          Member
        </button>
        <button
          type="button"
          onClick={() => setKind("guest")}
          style={{
            flex: 1,
            padding: "8px 10px",
            borderRadius: 999,
            background: kind === "guest" ? "var(--accent-soft)" : "var(--bg-2)",
            color: kind === "guest" ? "var(--accent-hi)" : "var(--fg-1)",
            border: "none",
            cursor: "pointer",
            fontSize: 13,
            fontWeight: 500,
          }}
        >
          Guest
        </button>
      </div>

      {kind === "member" ? (
        <div>
          <label className="pkr-label">Pick member</label>
          <select name="member_id" required className="pkr-input">
            <option value="">— select —</option>
            {availableMembers.map((m) => (
              <option key={m.id} value={m.id}>
                {m.nickname}
              </option>
            ))}
          </select>
        </div>
      ) : (
        <div>
          <label className="pkr-label">Guest name</label>
          <input name="guest_name" type="text" required className="pkr-input" maxLength={64} />
        </div>
      )}

      <div>
        <label className="pkr-label">Buy-in</label>
        <input
          name="buy_in_amount"
          type="number"
          step="0.01"
          min="0.01"
          required
          defaultValue={defaultBuyIn}
          className="pkr-input"
        />
      </div>

      {state.error && <div className="pkr-error">{state.error}</div>}

      <button
        type="submit"
        disabled={pending}
        className="pkr-btn pkr-btn--primary"
      >
        {pending ? "Adding…" : "Add to table"}
      </button>
    </form>
  );
}

function RebuyForm({
  sessionId,
  participantId,
  defaultBuyIn,
  onClose,
}: {
  sessionId: string;
  participantId: string;
  defaultBuyIn: string;
  onClose: () => void;
}) {
  const [state, action, pending] = useActionState(rebuyAction, initial);
  return (
    <form
      action={action}
      style={{ marginTop: 10, paddingTop: 10, borderTop: "0.5px solid var(--line)", display: "flex", gap: 8 }}
    >
      <input type="hidden" name="session_id" value={sessionId} />
      <input type="hidden" name="participant_id" value={participantId} />
      <input
        name="amount"
        type="number"
        step="0.01"
        min="0.01"
        defaultValue={defaultBuyIn}
        required
        autoFocus
        className="pkr-input"
        style={{ flex: 1, height: 36 }}
        placeholder="Amount"
      />
      <button type="submit" disabled={pending} className="pkr-btn pkr-btn--primary pkr-btn--sm">
        Add
      </button>
      <button type="button" onClick={onClose} className="pkr-btn pkr-btn--ghost pkr-btn--sm">
        ×
      </button>
      {state.error && <div className="pkr-error" style={{ width: "100%", marginTop: 6 }}>{state.error}</div>}
    </form>
  );
}

function CashOutForm({
  sessionId,
  participantId,
  onClose,
}: {
  sessionId: string;
  participantId: string;
  onClose: () => void;
}) {
  const [state, action, pending] = useActionState(cashOutAction, initial);
  return (
    <form
      action={action}
      style={{ marginTop: 10, paddingTop: 10, borderTop: "0.5px solid var(--line)", display: "flex", gap: 8 }}
    >
      <input type="hidden" name="session_id" value={sessionId} />
      <input type="hidden" name="participant_id" value={participantId} />
      <input
        name="stack_amount"
        type="number"
        step="0.01"
        min="0"
        required
        autoFocus
        className="pkr-input"
        style={{ flex: 1, height: 36 }}
        placeholder="Final stack"
      />
      <button type="submit" disabled={pending} className="pkr-btn pkr-btn--primary pkr-btn--sm">
        Cash out
      </button>
      <button type="button" onClick={onClose} className="pkr-btn pkr-btn--ghost pkr-btn--sm">
        ×
      </button>
      {state.error && <div className="pkr-error" style={{ width: "100%", marginTop: 6 }}>{state.error}</div>}
    </form>
  );
}

function UndoButton({ sessionId, disabled }: { sessionId: string; disabled: boolean }) {
  const [state, action, pending] = useActionState(undoLastAction, initial);
  return (
    <form action={action} style={{ flex: 1 }}>
      <input type="hidden" name="session_id" value={sessionId} />
      <button
        type="submit"
        disabled={disabled || pending}
        className="pkr-btn pkr-btn--ghost pkr-btn--block"
        title={state.error ?? ""}
      >
        ↶ Undo last
      </button>
    </form>
  );
}

function EndSessionButton({
  sessionId,
  disabled,
  setBusy,
}: {
  sessionId: string;
  disabled: boolean;
  setBusy: (b: boolean) => void;
}) {
  const [state, action, pending] = useActionState(endSessionAction, initial);
  useEffect(() => setBusy(pending), [pending, setBusy]);
  return (
    <form
      action={action}
      style={{ flex: 1 }}
      onSubmit={(e) => {
        if (!confirm("End the session?")) e.preventDefault();
      }}
    >
      <input type="hidden" name="session_id" value={sessionId} />
      <button
        type="submit"
        disabled={disabled || pending}
        className="pkr-btn pkr-btn--danger pkr-btn--block"
      >
        {pending ? "Ending…" : "End session"}
      </button>
      {state.error && (
        <div className="pkr-error" style={{ marginTop: 8 }}>
          {state.error}
        </div>
      )}
    </form>
  );
}
