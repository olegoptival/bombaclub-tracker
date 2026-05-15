import { MoneyDisplay } from "@/components/money-display";
import { Icon } from "@/components/ui/icon";
import {
  AreaChart,
  type AreaChartPoint,
} from "@/components/ui/area-chart";
import { PeriodPicker, type Period } from "@/components/ui/period-picker";
import { LastSessionCallout } from "./last-session-callout";

function periodCaption(period: Period): string {
  return period === "week"
    ? "this week"
    : period === "month"
      ? "this month"
      : "all time";
}

export type LastSessionInfo = {
  type: "online" | "offline" | string | null | undefined;
  title: string;
  date: Date | null;
  pnl: number | null;
};

export function BalanceCard({
  balance,
  period,
  sessionsCount,
  chartData,
  lastSession,
}: {
  balance: number;
  period: Period;
  sessionsCount: number;
  chartData: AreaChartPoint[];
  lastSession: LastSessionInfo | null;
}) {
  return (
    <div
      className="pkr-card"
      style={{
        padding: 18,
        background:
          "linear-gradient(180deg, rgba(20,19,15,0.6) 0%, var(--bg-1) 100%)",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 18,
          right: 18,
          height: 2,
          background:
            "linear-gradient(90deg, transparent, var(--accent), transparent)",
          opacity: 0.3,
        }}
      />
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: 10,
          marginBottom: 4,
        }}
      >
        <div className="pkr-section-label">Your balance</div>
        <PeriodPicker value={period} />
      </div>

      <div style={{ marginTop: 4 }}>
        <MoneyDisplay value={balance} size="hero" />
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          marginTop: 6,
          fontSize: 12.5,
          color: "var(--fg-2)",
          flexWrap: "wrap",
        }}
      >
        <Icon
          name="trend"
          size={12}
          color={balance >= 0 ? "var(--pos, #6dca7a)" : "var(--neg, #e5746a)"}
        />
        <span data-mono>{periodCaption(period)}</span>
        <span style={{ color: "var(--fg-3, var(--fg-2))" }}>·</span>
        <span>
          {sessionsCount} {sessionsCount === 1 ? "session" : "sessions"}
        </span>
      </div>

      {sessionsCount > 0 && (
        <>
          <div style={{ marginTop: 14 }}>
            <AreaChart data={chartData} width={420} height={120} />
          </div>
          {lastSession && (
            <LastSessionCallout
              type={lastSession.type}
              title={lastSession.title}
              date={lastSession.date}
              pnl={lastSession.pnl}
            />
          )}
        </>
      )}
    </div>
  );
}
