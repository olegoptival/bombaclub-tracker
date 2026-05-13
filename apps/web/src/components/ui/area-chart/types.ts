export type AreaChartPoint = {
  /** Tick label rendered on the X axis (e.g. "Apr 26"). */
  x: string;
  /** Value plotted on the Y axis. For the dashboard this is the cumulative PnL. */
  value: number;
  /** Optional metadata surfaced in the hover tooltip. */
  meta?: AreaChartPointMeta;
};

export type AreaChartPointMeta = {
  /** Human-readable date for the tooltip header (e.g. "Apr 26, 2026"). */
  dateLabel: string;
  /** Per-session profit/loss. */
  pnl: number;
};
