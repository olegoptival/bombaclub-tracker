"use client";

import { switchClubAction } from "@/lib/actions/switch-club";

type Club = {
  club_id: string;
  club_name: string;
  role: "player" | "host";
};

export function ClubSwitcher({
  clubs,
  activeClubId,
}: {
  clubs: Club[];
  activeClubId: string;
}) {
  if (clubs.length <= 1) {
    const only = clubs[0];
    return only ? (
      <span data-mono style={{ fontSize: 11, color: "var(--fg-2)" }}>
        {only.club_name}
      </span>
    ) : null;
  }

  return (
    <form
      action={switchClubAction}
      style={{ display: "inline-flex", alignItems: "center" }}
    >
      <select
        name="club_id"
        defaultValue={activeClubId}
        onChange={(e) => e.currentTarget.form?.requestSubmit()}
        className="pkr-input"
        style={{
          height: 28,
          fontSize: 12,
          paddingInline: 8,
          background: "var(--bg-2)",
          color: "var(--fg-1)",
          fontWeight: 500,
          minWidth: 120,
        }}
      >
        {clubs.map((c) => (
          <option key={c.club_id} value={c.club_id}>
            {c.club_name}
            {c.role === "host" ? " · host" : ""}
          </option>
        ))}
      </select>
    </form>
  );
}
