import Link from "next/link";
import { logoutAction } from "@/lib/actions/logout";
import { auth } from "@/auth";
import { AdminNav } from "./nav";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  const user = session?.user;

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      {/* Top bar */}
      <header
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "14px 16px",
          borderBottom: "0.5px solid var(--line)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Link
            href="/"
            style={{
              fontSize: 14,
              fontWeight: 600,
              letterSpacing: "-0.01em",
              color: "var(--fg-0)",
              textDecoration: "none",
            }}
          >
            Bombaclub Tracker
          </Link>
          <span
            style={{
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
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 12, color: "var(--fg-2)" }} data-mono>
            {user?.login}
          </span>
          <form action={logoutAction}>
            <button type="submit" className="pkr-btn pkr-btn--ghost pkr-btn--sm">
              Sign out
            </button>
          </form>
        </div>
      </header>

      {/* Sidebar + content */}
      <div style={{ display: "flex", flex: 1, minHeight: 0 }}>
        <AdminNav />
        <div style={{ flex: 1, padding: "24px 24px 40px", overflowY: "auto" }}>
          <div style={{ maxWidth: 920, marginInline: "auto" }}>{children}</div>
        </div>
      </div>
    </div>
  );
}
