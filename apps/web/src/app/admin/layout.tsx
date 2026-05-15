import Link from "next/link";
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
    <div style={{ minHeight: "100vh" }}>
      <div style={{ maxWidth: 920, marginInline: "auto", padding: "20px 16px 40px" }}>
        <header
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            paddingBottom: 4,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Link
              href="/"
              style={{
                fontSize: 14,
                fontWeight: 600,
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
          <span style={{ fontSize: 12, color: "var(--fg-2)" }} data-mono>
            {user?.login}
          </span>
        </header>

        <AdminNav />

        {children}
      </div>
    </div>
  );
}
