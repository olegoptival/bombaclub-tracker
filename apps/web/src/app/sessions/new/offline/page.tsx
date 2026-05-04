import Link from "next/link";

export const metadata = { title: "New offline session · Bombaclub Tracker" };

export default function NewOfflineSessionPage() {
  return (
    <main style={{ minHeight: "100vh", padding: "20px 16px 40px" }}>
      <div style={{ maxWidth: 460, marginInline: "auto" }}>
        <Link href="/sessions/new" style={{ fontSize: 13, color: "var(--fg-2)" }}>
          ← Back
        </Link>
        <h1 style={{ fontSize: 22, fontWeight: 600, marginTop: 16 }}>
          New offline session
        </h1>
        <p style={{ fontSize: 13, color: "var(--fg-2)", marginTop: 8 }}>
          Setup form + live table view come next.
        </p>
      </div>
    </main>
  );
}
