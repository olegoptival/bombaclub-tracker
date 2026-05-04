import Link from "next/link";

export const metadata = { title: "Admin · Bombaclub Tracker" };

export default function AdminPage() {
  return (
    <main style={{ minHeight: "100vh", padding: "20px 16px 40px" }}>
      <div style={{ maxWidth: 920, marginInline: "auto" }}>
        <Link
          href="/"
          style={{ fontSize: 13, color: "var(--fg-2)" }}
        >
          ← Back to dashboard
        </Link>
        <h1
          style={{
            fontSize: 24,
            fontWeight: 600,
            letterSpacing: "-0.01em",
            marginTop: 12,
          }}
        >
          Admin panel
        </h1>
        <p style={{ fontSize: 13, color: "var(--fg-2)", marginTop: 4 }}>
          Stage 4 will live here: clubs, users, audit log.
        </p>
      </div>
    </main>
  );
}
