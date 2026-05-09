import { Suspense } from "react";
import SectorMap from "@/components/SectorMap";
import HomeHero from "@/components/HomeHero";
import HomeFooterSections from "@/components/HomeFooterSections";

export const metadata = {
  title: "Home — PlotChain Paradise Valley",
};

export default function Home() {
  return (
    <div className="flex flex-col">
      {/* Decorative image strip at the top */}
      <HomeHero />

      {/* Map at viewport-minus-hero height */}
      <div className="relative h-[calc(100vh-64px)] overflow-hidden">
        <Suspense fallback={null}>
          <SectorMap />
        </Suspense>
      </div>

      {/* Informational sections below the map */}
      <HomeFooterSections />
    </div>
  );
}
