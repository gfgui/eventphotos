"use client";

import { unstable_rethrow } from "next/navigation";
import { useState, useTransition } from "react";

/**
 * Runs a Server Action of the panel. The error is one of the keys of the form's dictionary:
 * what the action reported, or "network" when it couldn't be reached.
 */
export function useAdminAction<Failure extends string>() {
  const [error, setError] = useState<Failure | "network" | null>(null);
  const [isPending, startTransition] = useTransition();

  function run(action: () => Promise<{ error?: Failure }>) {
    setError(null);
    startTransition(async () => {
      try {
        const result = await action();
        setError(result.error ?? null);
      } catch (cause) {
        // A successful action may end in a redirect, which reaches the client as an error.
        unstable_rethrow(cause);
        setError("network");
      }
    });
  }

  return { error, isPending, run };
}
