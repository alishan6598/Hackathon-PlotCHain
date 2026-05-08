"use client";

import posthog from "posthog-js";

export function track(event, props = {}) {
  try {
    if (typeof window === "undefined") return;
    if (!posthog.__loaded) return;
    posthog.capture(event, props);
  } catch {
    /* swallow */
  }
}

export const PH_EVENTS = {
  WALLET_CONNECTED: "wallet_connected",
  PLOT_VIEWED: "plot_viewed",
  PLOT_PURCHASED: "plot_purchased",
  PLOT_LISTED: "plot_listed",
  PLOT_DELISTED: "plot_delisted",
  PLOT_PRICE_UPDATED: "plot_price_updated",
  PLOT_MINTED: "plot_minted",
  CERTIFICATE_DOWNLOADED: "certificate_downloaded",
  DEALER_ADDED: "dealer_added",
  DEALER_REMOVED: "dealer_removed",
};
