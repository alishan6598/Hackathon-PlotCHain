"use client";

import { useEffect } from "react";
import posthog from "posthog-js";

export default function GlobalError({ error, reset }) {
  useEffect(() => {
    try {
      if (posthog.__loaded) {
        posthog.capture("$exception", {
          message: error?.message,
          stack: error?.stack,
          digest: error?.digest,
        });
      }
    } catch {
      /* swallow */
    }
    // eslint-disable-next-line no-console
    console.error("[PlotChain] error boundary:", error);
  }, [error]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-6">
      <div className="card max-w-lg w-full p-8 text-center">
        <h2 className="text-2xl font-semibold text-text mb-2">
          Something went wrong
        </h2>
        <p className="text-muted text-sm mb-6">
          {error?.message ?? "An unexpected error occurred."}
        </p>
        <button className="btn-amber" onClick={() => reset()}>
          Try again
        </button>
      </div>
    </div>
  );
}
