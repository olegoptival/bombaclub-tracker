import Link from "next/link";
import { getAppContext } from "@/lib/session/context";
import { logoutAction } from "@/lib/actions/logout";
import { ChangePasswordForm } from "./change-password-form";

export const metadata = { title: "Profile · Bombaclub Tracker" };
export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const ctx = await getAppContext();

  return (
    <main style={{ minHeight: "100vh", padding: "20px 16px 40px" }}>
      <div style={{ maxWidth: 460, marginInline: "auto" }}>
        <Link href="/" style={{ fontSize: 13, color: "var(--fg-2)", textDecoration: "none" }}>
          ← Back to dashboard
        </Link>

        <h1
          style={{
            fontSize: 22,
            fontWeight: 600,
            letterSpacing: "-0.01em",
            marginTop: 16,
            marginBottom: 18,
          }}
        >
          Profile
        </h1>

        {/* Account info */}
        <div className="pkr-card" style={{ padding: 14, marginBottom: 14 }}>
          <div className="pkr-section-label" style={{ marginBottom: 8 }}>
            Account
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <Field label="Display name" value={ctx.user.display_name} />
            <Field label="Login" value={ctx.user.login} mono />
            {ctx.user.isSuperuser && <Field label="Role" value="Super-admin" />}
          </div>
        </div>

        {/* Memberships */}
        {ctx.clubs.length > 0 && (
          <div className="pkr-card" style={{ padding: 14, marginBottom: 14 }}>
            <div className="pkr-section-label" style={{ marginBottom: 8 }}>
              Clubs · {ctx.clubs.length}
            </div>
            <div style={{ display: "flex", flexDirection: "column" }}>
              {ctx.clubs.map((c, i) => (
                <div
                  key={c.club_id}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "10px 0",
                    borderTop: i === 0 ? "none" : "0.5px solid var(--line)",
                    fontSize: 13,
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 500 }}>{c.club_name}</div>
                    <div style={{ fontSize: 11.5, color: "var(--fg-2)", marginTop: 2 }}>
                      {c.role} · "{c.nickname}"
                    </div>
                  </div>
                  <span data-mono style={{ fontSize: 11, color: "var(--fg-3)" }}>
                    {c.club_slug}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Change password */}
        <div className="pkr-card" style={{ padding: 14, marginBottom: 14 }}>
          <div className="pkr-section-label" style={{ marginBottom: 10 }}>
            Change password
          </div>
          <ChangePasswordForm />
        </div>

        {/* Sign out */}
        <form action={logoutAction}>
          <button
            type="submit"
            className="pkr-btn pkr-btn--ghost pkr-btn--block"
            style={{ height: 44 }}
          >
            Sign out
          </button>
        </form>
      </div>
    </main>
  );
}

function Field({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
      <span style={{ fontSize: 12, color: "var(--fg-2)" }}>{label}</span>
      <span data-mono={mono ? true : undefined} style={{ fontSize: 13, fontWeight: 500 }}>
        {value}
      </span>
    </div>
  );
}
