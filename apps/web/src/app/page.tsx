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
    <main className="flex min-h-screen items-center justify-center bg-zinc-950 text-zinc-100 p-8">
      <div className="text-center space-y-6 max-w-md">
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight">Bombaclub Tracker</h1>
          <p className="text-zinc-500 text-sm">Stage 2 — DB connected via Prisma ✓</p>
        </div>
        <div className="grid grid-cols-2 gap-3 text-left">
          {stats.map((s) => (
            <div key={s.label} className="rounded-lg border border-zinc-800 bg-zinc-900/50 px-4 py-3">
              <div className="text-xs text-zinc-500 uppercase tracking-wider">{s.label}</div>
              <div className="text-2xl font-mono mt-1">{s.value}</div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
