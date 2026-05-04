import Link from "next/link";

export const metadata = { title: "Profile · Bombaclub Tracker" };

export default function ProfilePage() {
  return (
    <main style={{ minHeight: "100vh", padding: "20px 16px 40px" }}>
      <div style={{ maxWidth: 640, marginInline: "auto" }}>
        <Link href="/" style={{ fontSize: 13, color: "var(--fg-2)" }}>
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
          Profile
        </h1>
        <p style={{ fontSize: 13, color: "var(--fg-2)", marginTop: 4 }}>
          Stage 4 will add: change password, telegram chat id, club aliases.
        </p>
      </div>
    </main>
  );
}
