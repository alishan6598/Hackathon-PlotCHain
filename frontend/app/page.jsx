import { Suspense } from "react";
import SectorMap from "@/components/SectorMap";
import HomeHero from "@/components/HomeHero";

export const metadata = {
  title: "Home — PlotChain Paradise Valley",
};

export default function Home() {
  return (
    <div className="flex flex-col h-[calc(100vh-64px)]">
      {/* Decorative image strip at the top */}
      <HomeHero />

      {/* Full-remaining-height map */}
      <div className="flex-1 relative overflow-hidden">
        <Suspense fallback={null}>
          <SectorMap />
        </Suspense>
      </div>
    </div>
  );
}
