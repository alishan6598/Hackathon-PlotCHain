import "./globals.css";

import Providers from "./providers";
import NavBar from "@/components/NavBar";
import SideNavigator from "@/components/SideNavigator";

export const metadata = {
  title: "PlotChain — Paradise Valley",
  description:
    "On-chain real estate marketplace for Paradise Valley. Every plot is an NFT.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="bg-background text-on-surface min-h-screen antialiased">
        <Providers>
          {/* Fixed top bar */}
          <NavBar />

          <div className="flex pt-16 min-h-screen">
            {/* Fixed left sidebar — always visible on md+ */}
            <SideNavigator />

            {/* Page content shifts right by sidebar width */}
            <main className="flex-1 md:ml-[300px] min-h-[calc(100vh-64px)]">
              {children}
            </main>
          </div>
        </Providers>
      </body>
    </html>
  );
}
