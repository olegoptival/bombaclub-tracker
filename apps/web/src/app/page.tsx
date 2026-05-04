import { auth } from "@/auth";
import { db } from "@/lib/db";
import { logoutAction } from "@/lib/actions/logout";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function Home() {
  const session = await auth();
  const user = session?.user;

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
      {/* Header */}
      <header
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 28,
          maxWidth: 920,
          marginInline: "auto",
        }}
      >
        <div>
          <h1
            style={{
              fontSize: 18,
              fontWeight: 600,
              letterSpacing: "-0.01em",
            }}
          >
            Bombaclub Tracker
          </h1>
          <div style={{ fontSize: 12, color: "var(--fg-2)", marginTop: 2 }}>
            Signed in as <span data-mono>{user?.login}</span>
            {user?.isSuperuser && (
              <span
                style={{
                  marginLeft: 8,
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
            )}
          </div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {user?.isSuperuser && (
            <Link href="/admin" className="pkr-btn pkr-btn--ghost pkr-btn--sm">
              Admin
            </Link>
          )}
          <Link href="/profile" className="pkr-btn pkr-btn--ghost pkr-btn--sm">
            Profile
          </Link>
          <form action={logoutAction}>
            <button type="submit" className="pkr-btn pkr-btn--ghost pkr-btn--sm">
              Sign out
            </button>
          </form>
        </div>
      </header>

      {/* Body */}
      <div style={{ maxWidth: 920, marginInline: "auto" }}>
        <p style={{ fontSize: 13, color: "var(--fg-2)", marginBottom: 16 }}>
          Stage 3 — Auth ✓ · Dashboard placeholder
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
