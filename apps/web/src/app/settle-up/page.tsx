import { redirect } from "next/navigation";
import Link from "next/link";
import { Prisma } from "@prisma/client";
import { getAppContext } from "@/lib/session/context";
import { db } from "@/lib/db";
import { settle } from "@/lib/settle/algorithm";
import { SettleUpForm } from "./form";

export const metadata = { title: "Settle-up · Bombaclub Tracker" };
export const dynamic = "force-dynamic";

export default async function SettleUpPage() {
  const ctx = await getAppContext();
  const club = ctx.activeClub;
  if (!club || club.role !== "host") redirect("/");

  const members = await db.club_members.findMany({
    where: { club_id: club.club_id, status: "active" },
    select: { id: true, nickname: true, current_balance: true },
    orderBy: { current_balance: "desc" },
  });

  const nonZeroBalances = members
    .filter((m) => !m.current_balance.eq(0))
    .map((m) => ({
      player_id: m.id,
      name: m.nickname,
      amount: m.current_balance,
    }));

  const sum = nonZeroBalances.reduce(
    (acc, b) => acc.add(b.amount),
    new Prisma.Decimal(0)
  );

  // Preview transfers (don't write anything yet)
  let preview = nonZeroBalances.length > 0 && sum.abs().lte("0.01") ? settle(nonZeroBalances) : [];

  // Last closed periods
  const recentPeriods = await db.settlement_periods.findMany({
    where: { club_id: club.club_id, status: "closed" },
    orderBy: { closed_at: "desc" },
    take: 5,
    include: { _count: { select: { settlement_transfers: true } } },
  });

  // Default period: today
  const today = new Date().toISOString().slice(0, 10);

  return (
    <main style={{ minHeight: "100vh", padding: "20px 16px 40px" }}>
      <div style={{ maxWidth: 460, marginInline: "auto" }}>
        <Link href="/" style={{ fontSize: 13, color: "var(--fg-2)", textDecoration: "none" }}>
          ← Back
        </Link>
        <div style={{ marginTop: 18, marginBottom: 18 }}>
          <h1 style={{ fontSize: 22, fontWeight: 600, letterSpacing: "-0.01em", marginBottom: 4 }}>
            Settle-up
          </h1>
          <p style={{ fontSize: 13, color: "var(--fg-2)" }}>
            Zero out balances by recording who pays whom.
          </p>
        </div>

        <div className="pkr-card" style={{ padding: 14, marginBottom: 14 }}>
          <div className="pkr-section-label" style={{ marginBottom: 8 }}>
            Current balances
          </div>
          {members.length === 0 ? (
            <div style={{ fontSize: 13, color: "var(--fg-2)" }}>No members in this club.</div>
          ) : (
            <div>
              {members.map((m, i) => {
                const num = parseFloat(m.current_balance.toString());
                const color = num > 0 ? "var(--pos)" : num < 0 ? "var(--neg)" : "var(--fg-2)";
                return (
                  <div
                    key={m.id}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "10px 0",
                      borderTop: i === 0 ? "none" : "0.5px solid var(--line)",
                    }}
                  >
                    <span style={{ fontSize: 14, fontWeight: 500 }}>{m.nickname}</span>
                    <span data-mono style={{ fontSize: 15, fontWeight: 600, color }}>
                      {num > 0 ? "+" : num < 0 ? "−" : ""}
                      {Math.abs(num).toFixed(2)}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
          <div
            style={{
              marginTop: 8,
              paddingTop: 10,
              borderTop: "0.5px solid var(--line)",
              fontSize: 12,
              color: "var(--fg-2)",
              display: "flex",
              justifyContent: "space-between",
            }}
          >
            <span>Sum</span>
            <span data-mono>{parseFloat(sum.toString()).toFixed(2)}</span>
          </div>
        </div>

        {preview.length > 0 && (
          <div className="pkr-card" style={{ padding: 14, marginBottom: 14 }}>
            <div className="pkr-section-label" style={{ marginBottom: 8 }}>
              Proposed transfers · {preview.length}
            </div>
            <div style={{ display: "flex", flexDirection: "column" }}>
              {preview.map((t, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "8px 0",
                    borderTop: i === 0 ? "none" : "0.5px solid var(--line)",
                    fontSize: 13,
                  }}
                >
                  <span>
                    <span style={{ color: "var(--fg-2)" }}>{t.from_player_name}</span>
                    <span style={{ color: "var(--fg-3)", margin: "0 8px" }}>→</span>
                    <span style={{ fontWeight: 500 }}>{t.to_player_name}</span>
                  </span>
                  <span data-mono style={{ fontWeight: 600 }}>
                    {parseFloat(t.amount.toString()).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        <SettleUpForm
          clubId={club.club_id}
          today={today}
          canSubmit={preview.length > 0}
          sumOff={parseFloat(sum.toString())}
          balancesEmpty={nonZeroBalances.length === 0}
        />

        {recentPeriods.length > 0 && (
          <div style={{ marginTop: 24 }}>
            <div className="pkr-section-label" style={{ marginBottom: 10, paddingInline: 4 }}>
              Recent settle-ups
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {recentPeriods.map((p) => (
                <div
                  key={p.id}
                  className="pkr-card"
                  style={{
                    padding: 12,
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    fontSize: 13,
                  }}
                >
                  <span data-mono style={{ color: "var(--fg-2)" }}>
                    {new Date(p.period_start).toLocaleDateString()} – {new Date(p.period_end).toLocaleDateString()}
                  </span>
                  <span style={{ color: "var(--fg-2)" }}>
                    {p._count.settlement_transfers} transfer{p._count.settlement_transfers !== 1 ? "s" : ""}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
