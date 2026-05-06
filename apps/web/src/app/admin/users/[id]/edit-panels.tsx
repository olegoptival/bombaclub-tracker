"use client";

import { useActionState, useState, useRef, useEffect } from "react";
import {
  updateDisplayNameAction,
  updateMembershipAction,
  addMembershipAction,
  removeMembershipAction,
  resetPasswordAction,
  deactivateUserAction,
  deleteUserAction,
  type SimpleState,
  type ResetPasswordState,
} from "../actions";

const empty: SimpleState = {};
const emptyReset: ResetPasswordState = {};

type User = {
  id: string;
  login: string;
  display_name: string;
  is_superuser: boolean;
};

type Membership = {
  id: string;
  club_id: string;
  club_name: string;
  club_slug: string;
  role: "player" | "host";
  nickname: string;
  status: "active" | "inactive";
  current_balance: string;
};

type Club = { id: string; name: string };

export function EditUserPanels({
  user,
  memberships,
  availableClubs,
}: {
  user: User;
  memberships: Membership[];
  availableClubs: Club[];
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <DisplayNamePanel user={user} />

      <div className="pkr-card" style={{ padding: 14 }}>
        <div className="pkr-section-label" style={{ marginBottom: 10 }}>
          Memberships · {memberships.length}
        </div>
        {memberships.length === 0 ? (
          <div style={{ fontSize: 13, color: "var(--fg-2)" }}>
            Not a member of any club yet.
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {memberships.map((m) => (
              <MembershipRow key={m.id} userId={user.id} membership={m} />
            ))}
          </div>
        )}
      </div>

      {availableClubs.length > 0 && (
        <AddMembershipPanel
          userId={user.id}
          defaultNickname={user.display_name}
          clubs={availableClubs}
        />
      )}

      <ResetPasswordPanel user={user} />

      {!user.is_superuser && (
        <>
          <DeactivatePanel user={user} />
          <DeletePanel user={user} />
        </>
      )}
    </div>
  );
}

function DisplayNamePanel({ user }: { user: User }) {
  const [state, action, pending] = useActionState(updateDisplayNameAction, empty);
  return (
    <form
      action={action}
      className="pkr-card"
      style={{ padding: 14, display: "flex", flexDirection: "column", gap: 10 }}
    >
      <input type="hidden" name="user_id" value={user.id} />
      <div className="pkr-section-label">Display name</div>
      <div style={{ display: "flex", gap: 8 }}>
        <input
          name="display_name"
          type="text"
          defaultValue={user.display_name}
          required
          maxLength={128}
          className="pkr-input"
          style={{ flex: 1 }}
        />
        <button type="submit" disabled={pending} className="pkr-btn pkr-btn--primary pkr-btn--sm">
          Save
        </button>
      </div>
      {state.error && <div className="pkr-error">{state.error}</div>}
      {state.success && <SuccessLine text={state.success} />}
    </form>
  );
}

function MembershipRow({
  userId,
  membership,
}: {
  userId: string;
  membership: Membership;
}) {
  const [state, action, pending] = useActionState(updateMembershipAction, empty);
  const [removeState, removeAction, removePending] = useActionState(
    removeMembershipAction,
    empty
  );

  const balanceNum = parseFloat(membership.current_balance);
  const balanceColor =
    balanceNum > 0 ? "var(--pos)" : balanceNum < 0 ? "var(--neg)" : "var(--fg-2)";

  return (
    <div
      style={{
        padding: 12,
        borderRadius: 10,
        background: "var(--bg-2)",
        boxShadow: "0 0 0 0.5px var(--line) inset",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 600 }}>{membership.club_name}</div>
          <div style={{ fontSize: 11.5, color: "var(--fg-2)", marginTop: 2 }}>
            <span data-mono>{membership.club_slug}</span>
            <span style={{ margin: "0 6px" }}>·</span>
            <span>balance </span>
            <span data-mono style={{ color: balanceColor }}>
              {balanceNum.toFixed(2)}
            </span>
          </div>
        </div>
      </div>

      <form action={action} style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <input type="hidden" name="membership_id" value={membership.id} />
        <input type="hidden" name="user_id" value={userId} />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          <div>
            <label className="pkr-label">Role</label>
            <select name="role" defaultValue={membership.role} className="pkr-input">
              <option value="player">Player</option>
              <option value="host">Host</option>
            </select>
          </div>
          <div>
            <label className="pkr-label">Status</label>
            <select name="status" defaultValue={membership.status} className="pkr-input">
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>
        <div>
          <label className="pkr-label">Nickname in this club</label>
          <input
            name="nickname"
            type="text"
            defaultValue={membership.nickname}
            required
            maxLength={64}
            className="pkr-input"
          />
        </div>
        {state.error && <div className="pkr-error">{state.error}</div>}
        {state.success && <SuccessLine text={state.success} />}
        <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
          <button
            type="submit"
            disabled={pending}
            className="pkr-btn pkr-btn--primary pkr-btn--sm"
            style={{ flex: 1 }}
          >
            {pending ? "Saving…" : "Save changes"}
          </button>
        </div>
      </form>

      <form action={removeAction} style={{ marginTop: 8 }}>
        <input type="hidden" name="membership_id" value={membership.id} />
        <input type="hidden" name="user_id" value={userId} />
        <button
          type="submit"
          disabled={removePending}
          className="pkr-btn pkr-btn--ghost pkr-btn--sm pkr-btn--block"
          onClick={(e) => {
            if (!confirm("Remove user from this club entirely?")) e.preventDefault();
          }}
        >
          Remove from club
        </button>
        {removeState.error && <div className="pkr-error">{removeState.error}</div>}
      </form>
    </div>
  );
}

function AddMembershipPanel({
  userId,
  defaultNickname,
  clubs,
}: {
  userId: string;
  defaultNickname: string;
  clubs: Club[];
}) {
  const [state, action, pending] = useActionState(addMembershipAction, empty);
  return (
    <form
      action={action}
      className="pkr-card"
      style={{ padding: 14, display: "flex", flexDirection: "column", gap: 10 }}
    >
      <input type="hidden" name="user_id" value={userId} />
      <div className="pkr-section-label">Add to another club</div>
      <div>
        <label className="pkr-label">Club</label>
        <select name="club_id" required defaultValue="" className="pkr-input">
          <option value="" disabled>— pick a club —</option>
          {clubs.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
        <div>
          <label className="pkr-label">Role</label>
          <select name="role" defaultValue="player" className="pkr-input">
            <option value="player">Player</option>
            <option value="host">Host</option>
          </select>
        </div>
        <div>
          <label className="pkr-label">Nickname</label>
          <input
            name="nickname"
            type="text"
            defaultValue={defaultNickname}
            required
            maxLength={64}
            className="pkr-input"
          />
        </div>
      </div>
      {state.error && <div className="pkr-error">{state.error}</div>}
      {state.success && <SuccessLine text={state.success} />}
      <button type="submit" disabled={pending} className="pkr-btn pkr-btn--primary">
        {pending ? "Adding…" : "Add to club"}
      </button>
    </form>
  );
}

function ResetPasswordPanel({ user }: { user: User }) {
  const [state, action, pending] = useActionState(resetPasswordAction, emptyReset);
  const [copied, setCopied] = useState(false);

  return (
    <form action={action} className="pkr-card" style={{ padding: 14 }}>
      <input type="hidden" name="user_id" value={user.id} />
      <div className="pkr-section-label" style={{ marginBottom: 10 }}>
        Reset password
      </div>
      {!state.success ? (
        <>
          <p style={{ fontSize: 12.5, color: "var(--fg-2)", marginBottom: 10 }}>
            Generates a new temporary password and forces the user to change it on next login.
          </p>
          <button
            type="submit"
            disabled={pending}
            className="pkr-btn pkr-btn--ghost pkr-btn--block"
            onClick={(e) => {
              if (!confirm(`Reset password for ${user.login}?`)) e.preventDefault();
            }}
          >
            {pending ? "Generating…" : "Generate new temporary password"}
          </button>
          {state.error && <div className="pkr-error" style={{ marginTop: 8 }}>{state.error}</div>}
        </>
      ) : (
        <div>
          <p style={{ fontSize: 12.5, color: "var(--fg-2)", marginBottom: 8 }}>
            New temporary password (shown once):
          </p>
          <div
            style={{
              display: "flex",
              gap: 8,
              alignItems: "center",
              padding: "10px 12px",
              borderRadius: 8,
              background: "var(--bg-2)",
              boxShadow: "0 0 0 0.5px var(--line) inset",
            }}
          >
            <code data-mono style={{ flex: 1, fontSize: 14, fontWeight: 600 }}>
              {state.success.tempPassword}
            </code>
            <button
              type="button"
              className="pkr-btn pkr-btn--ghost pkr-btn--sm"
              onClick={async () => {
                await navigator.clipboard.writeText(state.success!.tempPassword);
                setCopied(true);
                setTimeout(() => setCopied(false), 1500);
              }}
            >
              {copied ? "Copied" : "Copy"}
            </button>
          </div>
        </div>
      )}
    </form>
  );
}

function DeactivatePanel({ user }: { user: User }) {
  const [state, action, pending] = useActionState(deactivateUserAction, empty);
  return (
    <form
      action={action}
      className="pkr-card"
      style={{ padding: 14, background: "rgba(217,117,101,0.05)" }}
    >
      <input type="hidden" name="user_id" value={user.id} />
      <div className="pkr-section-label" style={{ marginBottom: 8, color: "var(--neg)" }}>
        Danger zone
      </div>
      <p style={{ fontSize: 12.5, color: "var(--fg-2)", marginBottom: 10 }}>
        Deactivates this user across all clubs. Their account stays in the database but
        all memberships go to status &laquo;inactive&raquo;. Login will be blocked.
      </p>
      <button
        type="submit"
        disabled={pending}
        className="pkr-btn pkr-btn--danger pkr-btn--block"
        onClick={(e) => {
          if (!confirm(`Deactivate ${user.login} across ALL clubs? This cannot be partially undone.`))
            e.preventDefault();
        }}
      >
        {pending ? "Deactivating…" : "Deactivate user"}
      </button>
      {state.error && <div className="pkr-error" style={{ marginTop: 8 }}>{state.error}</div>}
      {state.success && <SuccessLine text={state.success} />}
    </form>
  );
}


function DeletePanel({ user }: { user: User }) {
  const [state, action, pending] = useActionState(deleteUserAction, empty);
  return (
    <form
      action={action}
      className="pkr-card"
      style={{ padding: 14, background: "rgba(217,117,101,0.08)" }}
    >
      <input type="hidden" name="user_id" value={user.id} />
      <div className="pkr-section-label" style={{ marginBottom: 8, color: "var(--neg)" }}>
        Delete user
      </div>
      <p style={{ fontSize: 12.5, color: "var(--fg-2)", marginBottom: 10 }}>
        Hard-deletes the account. Only works if the user has no activity
        anywhere &mdash; no sessions hosted, no participations, no ledger entries.
        Otherwise you have to deactivate.
      </p>
      <button
        type="submit"
        disabled={pending}
        className="pkr-btn pkr-btn--danger pkr-btn--block"
        onClick={(e) => {
          if (!confirm(`Permanently delete ${user.login}? This cannot be undone.`))
            e.preventDefault();
        }}
      >
        {pending ? "Deleting…" : "Delete user permanently"}
      </button>
      {state.error && <div className="pkr-error" style={{ marginTop: 8 }}>{state.error}</div>}
    </form>
  );
}

function SuccessLine({ text }: { text: string }) {
  return (
    <div
      style={{
        fontSize: 12.5,
        color: "var(--pos)",
        background: "var(--pos-soft)",
        padding: "6px 10px",
        borderRadius: "var(--r-sm)",
        textAlign: "center",
      }}
    >
      {text}
    </div>
  );
}
