import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function Home() {
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
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 32,
      }}
    >
      <div style={{ maxWidth: 460, width: "100%" }}>
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontSize: 32, fontWeight: 600, letterSpacing: "-0.02em", marginBottom: 6 }}>
            Bombaclub Tracker
          </h1>
          <p style={{ fontSize: 14, color: "var(--fg-2)" }}>
            Stage 2 — DB connected via Prisma ✓
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          {stats.map((s) => (
            <div
              key={s.label}
              className="pkr-card"
              style={{ padding: 16 }}
            >
              <div className="pkr-section-label" style={{ marginBottom: 6 }}>
                {s.label}
              </div>
              <div data-mono style={{ fontSize: 28, fontWeight: 500 }}>
                {s.value}
              </div>
            </div>
          ))}
        </div>

        <div style={{ marginTop: 24, display: "flex", gap: 8 }}>
          <button className="pkr-btn pkr-btn--primary">Primary</button>
          <button className="pkr-btn pkr-btn--ghost">Ghost</button>
        </div>
      </div>
    </main>
  );
}
