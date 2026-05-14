"use client";

import { useActionState, useState } from "react";
import { updateMemberAction, removeMemberAction, type ClubActionState } from "./actions";

type Props = {
  membershipId: string;
  nickname: string;
  role: "player" | "host";
  status: "active" | "inactive";
  currentBalance: string;
  hasActivity: boolean;
  isMe: boolean;
};

const initial: ClubActionState = {};

export function MemberRow({
  membershipId,
  nickname,
  role,
  status,
  currentBalance,
  hasActivity,
  isMe,
}: Props) {
  const [editing, setEditing] = useState(false);
  const [updateState, updateAction, updatePending] = useActionState(
    updateMemberAction,
    initial
  );
  const [removeState, removeAction, removePending] = useActionState(
    removeMemberAction,
    initial
  );

  const balance = parseFloat(currentBalance);
  const balColor =
    balance > 0 ? "var(--pos)" : balance < 0 ? "var(--neg)" : "var(--fg-1)";

  if (!editing) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "10px 0",
          borderTop: "0.5px solid var(--line)",
          opacity: status === "inactive" ? 0.55 : 1,
        }}
      >
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ fontSize: 14, fontWeight: 500, display: "flex", alignItems: "center", gap: 6 }}>
            {nickname}
            {role === "host" && (
              <span
                style={{
                  padding: "1px 6px",
                  fontSize: 9.5,
                  fontWeight: 600,
                  textTransform: "uppercase",
                  letterSpacing: 0.04,
                  background: "var(--felt-soft)",
                  color: "var(--felt)",
                  borderRadius: 999,
                }}
              >
                Host
              </span>
            )}
            {status === "inactive" && (
              <span
                style={{
                  padding: "1px 6px",
                  fontSize: 9.5,
                  fontWeight: 600,
                  textTransform: "uppercase",
                  background: "var(--bg-3)",
                  color: "var(--fg-3)",
                  borderRadius: 999,
                }}
              >
                Inactive
              </span>
            )}
            {isMe && (
              <span style={{ fontSize: 10, color: "var(--fg-3)" }}>(you)</span>
            )}
          </div>
          <div data-mono style={{ fontSize: 11, color: balColor, marginTop: 2 }}>
            {balance >= 0 ? "+" : "−"}
            {Math.abs(balance).toFixed(2)}
          </div>
        </div>
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="pkr-btn pkr-btn--ghost pkr-btn--sm"
          style={{ height: 28 }}
        >
          Edit
        </button>
      </div>
    );
  }

  return (
    <div
      style={{
        padding: "12px 0",
        borderTop: "0.5px solid var(--line)",
      }}
    >
      <form
        key={`${membershipId}:${role}:${status}:${nickname}`}
        action={updateAction}
        style={{ display: "flex", flexDirection: "column", gap: 8 }}
      >
        <input type="hidden" name="membership_id" value={membershipId} />
        <div style={{ display: "flex", gap: 8 }}>
          <label className="pkr-label" style={{ flex: 1 }}>
            Nickname
            <input
              name="nickname"
              type="text"
              defaultValue={nickname}
              required
              className="pkr-input"
            />
          </label>
          <label className="pkr-label" style={{ width: 110 }}>
            Role
            <select name="role" defaultValue={role} className="pkr-input" disabled={isMe}>
              <option value="player">Player</option>
              <option value="host">Host</option>
            </select>
          </label>
          <label className="pkr-label" style={{ width: 110 }}>
            Status
            <select name="status" defaultValue={status} className="pkr-input" disabled={isMe}>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </label>
        </div>

        {updateState.error && <div className="pkr-error">{updateState.error}</div>}

        <div style={{ display: "flex", gap: 6, justifyContent: "space-between" }}>
          <div>
            {!hasActivity && !isMe && (
              <form action={removeAction} style={{ display: "inline" }}>
                <input type="hidden" name="membership_id" value={membershipId} />
                <button
                  type="submit"
                  disabled={removePending}
                  className="pkr-btn pkr-btn--ghost pkr-btn--sm"
                  style={{ color: "var(--neg)" }}
                >
                  {removePending ? "Removing…" : "Remove"}
                </button>
              </form>
            )}
            {removeState.error && (
              <span className="pkr-error" style={{ marginLeft: 8 }}>
                {removeState.error}
              </span>
            )}
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="pkr-btn pkr-btn--ghost pkr-btn--sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={updatePending}
              className="pkr-btn pkr-btn--primary pkr-btn--sm"
            >
              {updatePending ? "Saving…" : "Save"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
