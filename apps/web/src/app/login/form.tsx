"use client";

import { useActionState } from "react";
import { loginAction, type LoginState } from "./actions";

const initialState: LoginState = {};

export function LoginForm({ from }: { from: string }) {
  const [state, formAction, pending] = useActionState(loginAction, initialState);

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
      <div
        className="pkr-card"
        style={{
          width: "100%",
          maxWidth: 380,
          padding: 28,
        }}
      >
        <div style={{ marginBottom: 24 }}>
          <h1
            style={{
              fontSize: 22,
              fontWeight: 600,
              letterSpacing: "-0.01em",
              marginBottom: 4,
            }}
          >
            Sign in
          </h1>
          <p style={{ fontSize: 13, color: "var(--fg-2)" }}>
            Bombaclub Tracker
          </p>
        </div>

        <form action={formAction} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <input type="hidden" name="from" value={from} />

          <div>
            <label htmlFor="login" className="pkr-label">Login</label>
            <input
              id="login"
              name="login"
              type="text"
              autoComplete="username"
              autoCapitalize="none"
              autoFocus
              required
              className="pkr-input"
              placeholder="admin"
            />
          </div>

          <div>
            <label htmlFor="password" className="pkr-label">Password</label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              className="pkr-input"
            />
          </div>

          {state.error && <div className="pkr-error">{state.error}</div>}

          <button
            type="submit"
            disabled={pending}
            className="pkr-btn pkr-btn--primary pkr-btn--block"
            style={{ marginTop: 8 }}
          >
            {pending ? "Signing in…" : "Sign in"}
          </button>
        </form>

        <p className="pkr-help" style={{ marginTop: 18, textAlign: "center" }}>
          Forgot password? Contact your super-admin.
        </p>
      </div>
    </main>
  );
}
