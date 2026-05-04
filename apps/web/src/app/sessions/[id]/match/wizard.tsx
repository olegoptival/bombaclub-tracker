"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";

type Participant = {
  id: string;
  club_member_id: string | null;
  member_nickname: string | null;
  guest_name: string | null;
  total_pnl: string;
  alias_ids: string[];
  screens_count: number;
};

type Member = { id: string; nickname: string };

export function MatchingWizard({ sessionId }: { sessionId: string }) {
  const router = useRouter();
  const [participants, setParticipants] = useState<Participant[] | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [ack, setAck] = useState<Set<string>>(new Set());

  const reload = useCallback(async () => {
    const res = await fetch(`/api/sessions/${sessionId}/participants`, {
      cache: "no-store",
    });
    if (!res.ok) return;
    const data = await res.json();
    setParticipants(data.participants);
    setMembers(data.members);
  }, [sessionId]);

  useEffect(() => {
    reload();
  }, [reload]);

  const act = async (
    pid: string,
    body: Record<string, unknown>
  ) => {
    setBusyId(pid);
    try {
      const res = await fetch(`/api/sessions/${sessionId}/participants/${pid}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const data = await res.json();
        alert(data.error ?? "Failed");
        return;
      }
      setAck((prev) => new Set(prev).add(pid));
      await reload();
    } finally {
      setBusyId(null);
    }
  };

  if (participants === null) {
    return <div style={{ color: "var(--fg-2)", fontSize: 13 }}>Loading…</div>;
  }

  const unmatched = participants.filter((p) => !p.club_member_id && !ack.has(p.id));
  const matched = participants.filter((p) => p.club_member_id || ack.has(p.id));

  const allDone = unmatched.length === 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      {unmatched.length > 0 && (
        <section>
          <div className="pkr-section-label" style={{ marginBottom: 10, paddingInline: 4 }}>
            Needs your attention · {unmatched.length}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {unmatched.map((p) => (
              <UnmatchedCard
                key={p.id}
                p={p}
                members={members}
                busy={busyId === p.id}
                onMatch={(memberId) =>
                  act(p.id, { action: "match", club_member_id: memberId, save_alias: true })
                }
                onKeepGuest={() => act(p.id, { action: "guest" })}
                onDelete={() => {
                  if (confirm("Delete this player from the session?")) {
                    act(p.id, { action: "delete" });
                  }
                }}
              />
            ))}
          </div>
        </section>
      )}

      {matched.length > 0 && (
        <section>
          <div className="pkr-section-label" style={{ marginBottom: 10, paddingInline: 4 }}>
            Matched · {matched.length}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {matched.map((p) => (
              <MatchedRow
                key={p.id}
                p={p}
                onUnlink={() => act(p.id, { action: "guest" })}
              />
            ))}
          </div>
        </section>
      )}

      <button
        type="button"
        disabled={!allDone || participants.length === 0}
        onClick={() => router.push(`/sessions/${sessionId}/review`)}
        className="pkr-btn pkr-btn--primary pkr-btn--block"
      >
        Continue to review
      </button>
      {!allDone && (
        <p className="pkr-help" style={{ textAlign: "center", marginTop: -8 }}>
          Resolve all unmatched players first.
        </p>
      )}
    </div>
  );
}

function UnmatchedCard({
  p,
  members,
  busy,
  onMatch,
  onKeepGuest,
  onDelete,
}: {
  p: Participant;
  members: Member[];
  busy: boolean;
  onMatch: (memberId: string) => void;
  onKeepGuest: () => void;
  onDelete: () => void;
}) {
  const [picked, setPicked] = useState<string>("");
  const pnl = parseFloat(p.total_pnl);
  const pnlColor = pnl > 0 ? "var(--pos)" : pnl < 0 ? "var(--neg)" : "var(--fg-1)";

  return (
    <div className="pkr-card" style={{ padding: 14 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10 }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 15, fontWeight: 600 }}>{p.guest_name ?? "Unknown"}</div>
          <div style={{ fontSize: 11.5, color: "var(--fg-2)", marginTop: 2 }}>
            {p.alias_ids.length > 0 && <span data-mono>ID {p.alias_ids.join(", ")} · </span>}
            {p.screens_count} screen{p.screens_count !== 1 ? "s" : ""}
          </div>
        </div>
        <div data-mono style={{ fontSize: 16, fontWeight: 600, color: pnlColor }}>
          {pnl > 0 ? "+" : pnl < 0 ? "−" : ""}
          {Math.abs(pnl).toFixed(2)}
        </div>
      </div>

      <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
        <select
          value={picked}
          onChange={(e) => setPicked(e.target.value)}
          className="pkr-input"
          style={{ flex: 1, height: 40 }}
        >
          <option value="">— match to club member —</option>
          {members.map((m) => (
            <option key={m.id} value={m.id}>
              {m.nickname}
            </option>
          ))}
        </select>
        <button
          type="button"
          disabled={busy || !picked}
          onClick={() => picked && onMatch(picked)}
          className="pkr-btn pkr-btn--primary pkr-btn--sm"
          style={{ paddingInline: 14 }}
        >
          Match
        </button>
      </div>

      <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
        <button
          type="button"
          disabled={busy}
          onClick={onKeepGuest}
          className="pkr-btn pkr-btn--ghost pkr-btn--sm"
          style={{ flex: 1 }}
        >
          Keep as guest
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={onDelete}
          className="pkr-btn pkr-btn--danger pkr-btn--sm"
          style={{ flex: 1 }}
        >
          Delete row
        </button>
      </div>
    </div>
  );
}

function MatchedRow({
  p,
  onUnlink,
}: {
  p: Participant;
  onUnlink: () => void;
}) {
  const pnl = parseFloat(p.total_pnl);
  const pnlColor = pnl > 0 ? "var(--pos)" : pnl < 0 ? "var(--neg)" : "var(--fg-1)";
  return (
    <div
      className="pkr-card"
      style={{
        padding: 12,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 10,
      }}
    >
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 600 }}>{p.member_nickname}</div>
        <div style={{ fontSize: 11.5, color: "var(--fg-2)", marginTop: 2 }}>
          {p.screens_count} screen{p.screens_count !== 1 ? "s" : ""}
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <span data-mono style={{ fontSize: 15, fontWeight: 600, color: pnlColor }}>
          {pnl > 0 ? "+" : pnl < 0 ? "−" : ""}
          {Math.abs(pnl).toFixed(2)}
        </span>
        <button
          type="button"
          onClick={onUnlink}
          className="pkr-btn pkr-btn--ghost pkr-btn--sm"
          style={{ height: 28 }}
        >
          Unlink
        </button>
      </div>
    </div>
  );
}
