"use client";

import { useActionState, useEffect, useRef } from "react";
import { changePasswordAction, type ChangePasswordState } from "./actions";

const initial: ChangePasswordState = {};

export function ChangePasswordForm() {
  const [state, action, pending] = useActionState(changePasswordAction, initial);
  const formRef = useRef<HTMLFormElement>(null);

  // On success, clear the form
  useEffect(() => {
    if (state.success) {
      formRef.current?.reset();
    }
  }, [state.success]);

  return (
    <form
      ref={formRef}
      action={action}
      style={{ display: "flex", flexDirection: "column", gap: 10 }}
    >
      <div>
        <label htmlFor="current_password" className="pkr-label">
          Current password
        </label>
        <input
          id="current_password"
          name="current_password"
          type="password"
          required
          autoComplete="current-password"
          className="pkr-input"
        />
      </div>
      <div>
        <label htmlFor="new_password" className="pkr-label">
          New password
        </label>
        <input
          id="new_password"
          name="new_password"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          className="pkr-input"
        />
      </div>
      <div>
        <label htmlFor="confirm_password" className="pkr-label">
          Confirm new password
        </label>
        <input
          id="confirm_password"
          name="confirm_password"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          className="pkr-input"
        />
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
            textAlign: "center",
          }}
        >
          {state.success}
        </div>
      )}
      <button
        type="submit"
        disabled={pending}
        className="pkr-btn pkr-btn--primary pkr-btn--block"
        style={{ marginTop: 4 }}
      >
        {pending ? "Updating…" : "Update password"}
      </button>
    </form>
  );
}
