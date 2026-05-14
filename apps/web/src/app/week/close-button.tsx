"use client";

import { useActionState } from "react";
import { closeWeekAction, reopenWeekAction, type WeekActionState } from "./actions";
import { formatWeekParam, type IsoWeek } from "./week-utils";

const initial: WeekActionState = {};

export function CloseButton({ week }: { week: IsoWeek }) {
  const [state, action, pending] = useActionState(closeWeekAction, initial);
  return (
    <form action={action}>
      <input type="hidden" name="week" value={formatWeekParam(week)} />
      <button
        type="submit"
        disabled={pending}
        className="pkr-btn pkr-btn--primary pkr-btn--block"
        style={{ height: 44, fontSize: 14 }}
      >
        {pending ? "Closing…" : "Close week & lock transfers"}
      </button>
      {state.error && (
        <div className="pkr-error" style={{ marginTop: 8 }}>
          {state.error}
        </div>
      )}
    </form>
  );
}

export function ReopenButton({ week }: { week: IsoWeek }) {
  const [state, action, pending] = useActionState(reopenWeekAction, initial);
  return (
    <form action={action}>
      <input type="hidden" name="week" value={formatWeekParam(week)} />
      <button
        type="submit"
        disabled={pending}
        className="pkr-btn pkr-btn--ghost pkr-btn--sm"
        style={{ height: 32 }}
      >
        {pending ? "Reopening…" : "Reopen week"}
      </button>
      {state.error && (
        <div className="pkr-error" style={{ marginTop: 8 }}>
          {state.error}
        </div>
      )}
    </form>
  );
}
