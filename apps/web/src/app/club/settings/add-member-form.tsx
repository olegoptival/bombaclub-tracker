"use client";

import { useActionState, useState } from "react";
import { addExistingMemberAction, createAndAddMemberAction, type AddMemberState } from "./actions";

type AvailableUser = { id: string; login: string; display_name: string };

type Props = {
  availableUsers: AvailableUser[];
};

const initialAdd: AddMemberState = {};
const initialCreate: AddMemberState = {};

export function AddMemberForm({ availableUsers }: Props) {
  const [mode, setMode] = useState<"existing" | "new">("existing");
  const [open, setOpen] = useState(false);

  const [addState, addAction, addPending] = useActionState(
    addExistingMemberAction,
    initialAdd
  );
  const [createState, createAction, createPending] = useActionState(
    createAndAddMemberAction,
    initialCreate
  );

  if (!open) {
    return (
      <div style={{ marginTop: 12 }}>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="pkr-btn pkr-btn--ghost pkr-btn--sm"
        >
          + Add member
        </button>
      </div>
    );
  }

  return (
    <div
      className="pkr-card"
      style={{
        padding: 14,
        marginTop: 12,
        background: "var(--bg-2)",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <div className="pkr-section-label">Add member</div>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="pkr-btn pkr-btn--ghost pkr-btn--sm"
          style={{ height: 26 }}
        >
          Cancel
        </button>
      </div>

      <div
        style={{
          display: "flex",
          gap: 4,
          padding: 3,
          marginBottom: 12,
          background: "var(--bg-1)",
          borderRadius: 8,
          border: "0.5px solid var(--line)",
        }}
      >
        <button
          type="button"
          onClick={() => setMode("existing")}
          className={`pkr-btn pkr-btn--sm`}
          style={{
            flex: 1,
            background: mode === "existing" ? "var(--bg-3)" : "transparent",
            color: mode === "existing" ? "var(--fg-0)" : "var(--fg-2)",
          }}
        >
          Existing user
        </button>
        <button
          type="button"
          onClick={() => setMode("new")}
          className={`pkr-btn pkr-btn--sm`}
          style={{
            flex: 1,
            background: mode === "new" ? "var(--bg-3)" : "transparent",
            color: mode === "new" ? "var(--fg-0)" : "var(--fg-2)",
          }}
        >
          New user
        </button>
      </div>

      {mode === "existing" ? (
        <form action={addAction} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <label className="pkr-label">
            User
            <select name="user_id" required className="pkr-input">
              <option value="">— select user —</option>
              {availableUsers.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.display_name} ({u.login})
                </option>
              ))}
            </select>
          </label>
          <div style={{ display: "flex", gap: 8 }}>
            <label className="pkr-label" style={{ flex: 1 }}>
              Nickname in club
              <input name="nickname" type="text" required className="pkr-input" />
            </label>
            <label className="pkr-label" style={{ width: 110 }}>
              Role
              <select name="role" defaultValue="player" className="pkr-input">
                <option value="player">Player</option>
                <option value="host">Host</option>
              </select>
            </label>
          </div>

          {addState.error && <div className="pkr-error">{addState.error}</div>}
          {addState.success && (
            <div style={{ fontSize: 12, color: "var(--pos)" }}>
              Added {addState.success.login} to the club.
            </div>
          )}

          <button
            type="submit"
            disabled={addPending || availableUsers.length === 0}
            className="pkr-btn pkr-btn--primary pkr-btn--sm"
          >
            {addPending ? "Adding…" : "Add to club"}
          </button>
          {availableUsers.length === 0 && (
            <div style={{ fontSize: 11, color: "var(--fg-3)" }}>
              No users available to add — all existing users are already members.
            </div>
          )}
        </form>
      ) : (
        <form action={createAction} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ display: "flex", gap: 8 }}>
            <label className="pkr-label" style={{ flex: 1 }}>
              Login
              <input
                name="login"
                type="text"
                required
                placeholder="lowercase, digits, _ -"
                className="pkr-input"
              />
            </label>
            <label className="pkr-label" style={{ flex: 1 }}>
              Display name
              <input name="display_name" type="text" required className="pkr-input" />
            </label>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <label className="pkr-label" style={{ flex: 1 }}>
              Nickname in club
              <input name="nickname" type="text" required className="pkr-input" />
            </label>
            <label className="pkr-label" style={{ width: 110 }}>
              Role
              <select name="role" defaultValue="player" className="pkr-input">
                <option value="player">Player</option>
                <option value="host">Host</option>
              </select>
            </label>
          </div>

          {createState.error && <div className="pkr-error">{createState.error}</div>}
          {createState.success && (
            <div
              className="pkr-card"
              style={{ padding: 10, background: "var(--bg-1)", border: "1px solid var(--accent-soft)" }}
            >
              <div style={{ fontSize: 12, color: "var(--pos)", marginBottom: 6 }}>
                Created user {createState.success.login}
              </div>
              <div style={{ fontSize: 11, color: "var(--fg-2)" }}>Temporary password — share once:</div>
              <div data-mono style={{ fontSize: 16, fontWeight: 600, color: "var(--accent-hi)" }}>
                {createState.success.tempPassword}
              </div>
              <div style={{ fontSize: 10, color: "var(--fg-3)", marginTop: 4 }}>
                User will be asked to change it on first login.
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={createPending}
            className="pkr-btn pkr-btn--primary pkr-btn--sm"
          >
            {createPending ? "Creating…" : "Create user & add to club"}
          </button>
        </form>
      )}
    </div>
  );
}
