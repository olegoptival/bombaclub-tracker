import Link from "next/link";
import { getAppContext } from "@/lib/session/context";
import { logoutAction } from "@/lib/actions/logout";
import { db } from "@/lib/db";
import { PlayerDashboard } from "./_player/dashboard";

export const dynamic = "force-dynamic";

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string | string[] }>;
}) {
  const sp = await searchParams;
  const ctx = await getAppContext();

  // Branch 1: user has at least one active club membership
  if (ctx.activeClub) {
    return <PlayerDashboard ctx={ctx} searchParams={sp} />;
  }

  // Branch 2: super-admin without any club membership — show system stats
  if (ctx.user.isSuperuser) {
    const [users, clubs, sessions, ledger] = await Promise.all([
      db.users.count(),
      db.clubs.count(),
      db.sessions.count(),
      db.ledger_entries.count(),
    ]);
    const stats = [
      { label: "users", value: users },
      { label: "clubs", value: clubs },
      { label: "sessions", value: sessions },
      { label: "ledger entries", value: ledger },
    ];
    return (
      <main style={{ minHeight: "100vh", padding: "20px 16px 40px" }}>
        <header
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            maxWidth: 920,
            marginInline: "auto",
            marginBottom: 28,
          }}
        >
          <div>
            <h1 style={{ fontSize: 18, fontWeight: 600 }}>Bombaclub Tracker</h1>
            <div style={{ fontSize: 12, color: "var(--fg-2)", marginTop: 2 }}>
              Signed in as <span data-mono>{ctx.user.login}</span>{" "}
              <span
                style={{
                  marginLeft: 4,
                  padding: "2px 7px",
                  fontSize: 10,
                  fontWeight: 600,
                  letterSpacing: 0.04,
                  textTransform: "uppercase",
                  background: "var(--accent-soft)",
                  color: "var(--accent-hi)",
                  borderRadius: 999,
                }}
              >
                Admin
              </span>
            </div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <Link href="/admin" className="pkr-btn pkr-btn--ghost pkr-btn--sm">
              Admin
            </Link>
            <Link href="/profile" className="pkr-btn pkr-btn--ghost pkr-btn--sm">
              Profile
            </Link>
            <form action={logoutAction}>
              <button className="pkr-btn pkr-btn--ghost pkr-btn--sm" type="submit">
                Sign out
              </button>
            </form>
          </div>
        </header>
        <div style={{ maxWidth: 920, marginInline: "auto" }}>
          <p style={{ fontSize: 13, color: "var(--fg-2)", marginBottom: 16 }}>
            System overview — you’re not yet a member of any club. Use the admin
            panel to create one and add yourself.
          </p>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
              gap: 12,
            }}
          >
            {stats.map((s) => (
              <div key={s.label} className="pkr-card" style={{ padding: 16 }}>
                <div className="pkr-section-label" style={{ marginBottom: 6 }}>
                  {s.label}
                </div>
                <div data-mono style={{ fontSize: 28, fontWeight: 500 }}>
                  {s.value}
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    );
  }

  // Branch 3: regular user with no active membership — defensive empty state
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
        style={{ maxWidth: 380, padding: 28, textAlign: "center" }}
      >
        <h1 style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>
          Hi, {ctx.user.display_name}
        </h1>
        <p style={{ fontSize: 13, color: "var(--fg-2)", lineHeight: 1.5 }}>
          Your account is created but you’re not in any club yet. Contact your
          super-admin.
        </p>
        <form action={logoutAction} style={{ marginTop: 18 }}>
          <button
            type="submit"
            className="pkr-btn pkr-btn--ghost pkr-btn--block"
          >
            Sign out
          </button>
        </form>
      </div>
    </main>
  );
}
