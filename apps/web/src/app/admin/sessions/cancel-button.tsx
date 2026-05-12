"use client";

import { useActionState } from "react";
import { cancelSessionAction, type CancelSessionState } from "./actions";

const initial: CancelSessionState = {};

export function CancelSessionButton({
  sessionId,
  label,
}: {
  sessionId: string;
  label: string;
}) {
  const [state, formAction, pending] = useActionState(cancelSessionAction, initial);

  return (
    <form
      action={formAction}
      onSubmit={(e) => {
        if (
          !confirm(
            `Cancel session "${label}"? Compensating ledger entries will be created and balances recalculated. The session record will be kept with status=cancelled.`
          )
        ) {
          e.preventDefault();
        }
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <input type="hidden" name="session_id" value={sessionId} />
      <button
        type="submit"
        disabled={pending}
        className="pkr-btn pkr-btn--ghost pkr-btn--sm"
        style={{ color: "var(--status-danger, #e5484d)" }}
        title={state.error ?? undefined}
      >
        {pending ? "Cancelling…" : "Cancel"}
      </button>
    </form>
  );
}
