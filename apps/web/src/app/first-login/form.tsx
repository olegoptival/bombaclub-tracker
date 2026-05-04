"use client";

import { useActionState } from "react";
import { changePasswordAction, type ChangePasswordState } from "./actions";

const initialState: ChangePasswordState = {};

export function ChangePasswordForm() {
  const [state, formAction, pending] = useActionState(
    changePasswordAction,
    initialState
  );

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
      }}
    >
      <div className="pkr-card" style={{ width: "100%", maxWidth: 420, padding: 28 }}>
        <div style={{ marginBottom: 18 }}>
          <h1
            style={{
              fontSize: 22,
              fontWeight: 600,
              letterSpacing: "-0.01em",
              marginBottom: 4,
            }}
          >
            Set your password
          </h1>
          <p style={{ fontSize: 13, color: "var(--fg-2)", lineHeight: 1.5 }}>
            Choose a new password to replace the temporary one. After this you’ll
            be signed out and asked to sign in with the new password.
          </p>
        </div>

        <form action={formAction} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div>
            <label htmlFor="currentPassword" className="pkr-label">
              Current (temporary) password
            </label>
            <input
              id="currentPassword"
              name="currentPassword"
              type="password"
              autoComplete="current-password"
              required
              className="pkr-input"
            />
          </div>

          <div>
            <label htmlFor="newPassword" className="pkr-label">
              New password
            </label>
            <input
              id="newPassword"
              name="newPassword"
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              className="pkr-input"
            />
            <div className="pkr-help">At least 8 characters.</div>
          </div>

          <div>
            <label htmlFor="confirmPassword" className="pkr-label">
              Confirm new password
            </label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              className="pkr-input"
            />
          </div>

          {state.error && <div className="pkr-error">{state.error}</div>}

          <button
            type="submit"
            disabled={pending}
            className="pkr-btn pkr-btn--primary pkr-btn--block"
            style={{ marginTop: 6 }}
          >
            {pending ? "Saving…" : "Save password and sign out"}
          </button>
        </form>
      </div>
    </main>
  );
}
