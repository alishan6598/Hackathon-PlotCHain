"use client";

import { useEffect, useState } from "react";
import { WagmiProvider, createConfig, http, createStorage } from "wagmi";
import { sepolia } from "wagmi/chains";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  RainbowKitProvider,
  getDefaultWallets,
  darkTheme,
} from "@rainbow-me/rainbowkit";
import posthog from "posthog-js";

import { ToastProvider } from "@/components/Toaster";

const { connectors } = getDefaultWallets({
  appName: "PlotChain",
  projectId:
    process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID ?? "plotchain-demo",
});

const noopStorage = {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {},
};

const wagmiConfig = createConfig({
  chains: [sepolia],
  connectors,
  transports: { [sepolia.id]: http() },
  storage: createStorage({
    storage: typeof window !== "undefined" ? window.localStorage : noopStorage,
  }),
});

function PostHogInit() {
  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
    if (!key) return;
    if (posthog.__loaded) return;
    posthog.init(key, {
      api_host:
        process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://us.i.posthog.com",
      capture_pageview: true,
      autocapture: false,
      person_profiles: "identified_only",
    });
  }, []);
  return null;
}

export default function Providers({ children }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { staleTime: 30_000, refetchOnWindowFocus: false },
        },
      })
  );

  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider
          theme={darkTheme({
            accentColor: "#f59e0b",
            accentColorForeground: "#0a0f1e",
            borderRadius: "medium",
            overlayBlur: "small",
          })}
          modalSize="compact"
        >
          <ToastProvider>
            <PostHogInit />
            {children}
          </ToastProvider>
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
