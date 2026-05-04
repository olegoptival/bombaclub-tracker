import { db } from "@/lib/db";
import { CreateClubForm } from "./create-form";

export const metadata = { title: "Clubs · Admin" };
export const dynamic = "force-dynamic";

export default async function AdminClubsPage() {
  const clubs = await db.clubs.findMany({
    orderBy: { created_at: "desc" },
    include: {
      _count: {
        select: { club_members: true, sessions: true },
      },
    },
  });

  return (
    <div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 18,
        }}
      >
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 600, letterSpacing: "-0.01em" }}>
            Clubs
          </h1>
          <p style={{ fontSize: 13, color: "var(--fg-2)", marginTop: 2 }}>
            {clubs.length} {clubs.length === 1 ? "club" : "clubs"} in the system.
          </p>
        </div>
      </div>

      <CreateClubForm />

      <div style={{ marginTop: 24 }}>
        {clubs.length === 0 ? (
          <div
            className="pkr-card"
            style={{
              padding: 28,
              textAlign: "center",
              color: "var(--fg-2)",
              fontSize: 13,
            }}
          >
            No clubs yet. Create the first one above.
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {clubs.map((c) => (
              <div
                key={c.id}
                className="pkr-card"
                style={{
                  padding: 14,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <div>
                  <div style={{ fontSize: 15, fontWeight: 600 }}>{c.name}</div>
                  <div
                    style={{
                      fontSize: 12,
                      color: "var(--fg-2)",
                      marginTop: 2,
                      display: "flex",
                      gap: 12,
                    }}
                  >
                    <span data-mono>/{c.slug}</span>
                    <span>•</span>
                    <span>{c._count.club_members} members</span>
                    <span>•</span>
                    <span>{c._count.sessions} sessions</span>
                    <span>•</span>
                    <span>{c.settlement_period}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
