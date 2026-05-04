import Link from "next/link";
import { redirect } from "next/navigation";
import { getAppContext } from "@/lib/session/context";

export const metadata = { title: "New session · Bombaclub Tracker" };
export const dynamic = "force-dynamic";

export default async function NewSessionPage() {
  const ctx = await getAppContext();
  const club = ctx.activeClub;

  // Only host can create sessions
  if (!club || club.role !== "host") {
    redirect("/");
  }

  return (
    <main style={{ minHeight: "100vh", padding: "20px 16px 40px" }}>
      <div style={{ maxWidth: 460, marginInline: "auto" }}>
        <Link
          href="/"
          style={{
            fontSize: 13,
            color: "var(--fg-2)",
            textDecoration: "none",
          }}
        >
          ← Cancel
        </Link>

        <div style={{ marginTop: 18, marginBottom: 24 }}>
          <h1
            style={{
              fontSize: 24,
              fontWeight: 600,
              letterSpacing: "-0.01em",
              marginBottom: 4,
            }}
          >
            New session
          </h1>
          <p style={{ fontSize: 13, color: "var(--fg-2)" }}>
            How is the game played?
          </p>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <ChoiceCard
            href="/sessions/new/online"
            kind="online"
            title="Online"
            subtitle="From ClubGG screenshots"
            description="Play your hand in ClubGG, then drop the result screenshots here. We'll OCR players and stacks automatically."
          />
          <ChoiceCard
            href="/sessions/new/offline"
            kind="offline"
            title="Offline"
            subtitle="Live table"
            description="At a real table with friends. Track buy-ins and cash-outs in real time as the game goes."
          />
        </div>
      </div>
    </main>
  );
}

function ChoiceCard({
  href,
  kind,
  title,
  subtitle,
  description,
}: {
  href: string;
  kind: "online" | "offline";
  title: string;
  subtitle: string;
  description: string;
}) {
  const accent =
    kind === "online" ? "var(--felt)" : "var(--accent)";
  const accentSoft =
    kind === "online" ? "var(--felt-soft)" : "var(--accent-soft)";

  return (
    <Link
      href={href}
      className="pkr-card"
      style={{
        padding: 20,
        textDecoration: "none",
        color: "inherit",
        display: "block",
        position: "relative",
        boxShadow: "var(--shadow-md)",
      }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
        <div
          aria-hidden
          style={{
            width: 44,
            height: 44,
            borderRadius: 12,
            background: accentSoft,
            color: accent,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          {kind === "online" ? (
            <MonitorIcon />
          ) : (
            <FeltIcon />
          )}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              display: "flex",
              alignItems: "baseline",
              gap: 8,
              marginBottom: 4,
            }}
          >
            <span style={{ fontSize: 17, fontWeight: 600 }}>{title}</span>
            <span style={{ fontSize: 12, color: "var(--fg-2)" }}>
              {subtitle}
            </span>
          </div>
          <div
            style={{
              fontSize: 13,
              color: "var(--fg-2)",
              lineHeight: 1.5,
            }}
          >
            {description}
          </div>
        </div>
        <div style={{ color: "var(--fg-3)", flexShrink: 0, marginTop: 4 }}>
          <ChevronRightIcon />
        </div>
      </div>
    </Link>
  );
}

// Inline icons (we'll factor these into a shared Icon component when we
// portfolio more screens — for now keeps the file self-contained)
function MonitorIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="4" width="20" height="12" rx="1" />
      <path d="M8 20h8M12 16v4" />
    </svg>
  );
}
function FeltIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <path d="M12 6v6l4 2" />
    </svg>
  );
}
function ChevronRightIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 18l6-6-6-6" />
    </svg>
  );
}
