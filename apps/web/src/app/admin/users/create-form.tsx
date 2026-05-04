"use client";

import { useActionState, useState } from "react";
import { createUserAction, type CreateUserState } from "./actions";

const initial: CreateUserState = {};

type Club = { id: string; name: string; slug: string };

export function CreateUserForm({ clubs }: { clubs: Club[] }) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(createUserAction, initial);

  // Success view: show temp password
  if (state.success && open) {
    return (
      <div className="pkr-card" style={{ padding: 18 }}>
        <h2 style={{ fontSize: 15, fontWeight: 600, marginBottom: 6 }}>
          User created ✓
        </h2>
        <p style={{ fontSize: 13, color: "var(--fg-2)", marginBottom: 16 }}>
          Hand these credentials to the user. The password is shown only once and
          cannot be recovered later — copy it now.
        </p>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 10,
            padding: 14,
            background: "var(--bg-2)",
            borderRadius: "var(--r-md)",
          }}
        >
          <CopyRow label="Login" value={state.success.login} />
          <CopyRow label="Temporary password" value={state.success.tempPassword} mono />
        </div>

        <p className="pkr-help" style={{ marginTop: 12 }}>
          The user will be forced to change this password on first sign-in.
        </p>

        <button
          onClick={() => {
            setOpen(false);
            // Force a fresh form by reloading the page (simplest)
            window.location.reload();
          }}
          className="pkr-btn pkr-btn--primary"
          style={{ marginTop: 16 }}
        >
          Done
        </button>
      </div>
    );
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="pkr-btn pkr-btn--primary">
        + New user
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
        <h2 style={{ fontSize: 15, fontWeight: 600 }}>Create user</h2>
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
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div>
            <label htmlFor="login" className="pkr-label">Login</label>
            <input
              id="login"
              name="login"
              type="text"
              autoCapitalize="none"
              required
              minLength={3}
              maxLength={64}
              className="pkr-input"
              placeholder="kostya"
            />
          </div>
          <div>
            <label htmlFor="display_name" className="pkr-label">Display name</label>
            <input
              id="display_name"
              name="display_name"
              type="text"
              required
              maxLength={128}
              className="pkr-input"
              placeholder="Kostya"
            />
          </div>
        </div>

        {clubs.length > 0 && (
          <>
            <div>
              <label htmlFor="club_id" className="pkr-label">
                Add to club (optional)
              </label>
              <select
                id="club_id"
                name="club_id"
                className="pkr-input"
                defaultValue=""
              >
                <option value="">— none —</option>
                {clubs.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div>
                <label htmlFor="role" className="pkr-label">Role in club</label>
                <select
                  id="role"
                  name="role"
                  className="pkr-input"
                  defaultValue="player"
                >
                  <option value="player">Player</option>
                  <option value="host">Host</option>
                </select>
              </div>
              <div>
                <label htmlFor="nickname" className="pkr-label">
                  Nickname in club
                </label>
                <input
                  id="nickname"
                  name="nickname"
                  type="text"
                  maxLength={64}
                  className="pkr-input"
                  placeholder="defaults to display name"
                />
              </div>
            </div>
          </>
        )}

        {state.error && <div className="pkr-error">{state.error}</div>}

        <button
          type="submit"
          disabled={pending}
          className="pkr-btn pkr-btn--primary"
          style={{ marginTop: 4 }}
        >
          {pending ? "Creating…" : "Create user"}
        </button>
      </form>
    </div>
  );
}

function CopyRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  const [copied, setCopied] = useState(false);
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 12,
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", minWidth: 0, flex: 1 }}>
        <div className="pkr-section-label">{label}</div>
        <div
          data-mono={mono ? true : undefined}
          style={{
            fontSize: mono ? 16 : 14,
            fontWeight: 600,
            marginTop: 2,
            wordBreak: "break-all",
          }}
        >
          {value}
        </div>
      </div>
      <button
        type="button"
        onClick={async () => {
          await navigator.clipboard.writeText(value);
          setCopied(true);
          setTimeout(() => setCopied(false), 1400);
        }}
        className="pkr-btn pkr-btn--ghost pkr-btn--sm"
      >
        {copied ? "Copied" : "Copy"}
      </button>
    </div>
  );
}
