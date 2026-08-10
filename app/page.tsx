import { HeroSection } from "@/components/hero-section";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { StatsStrip } from "@/components/stats-strip";
import { ToolDirectory } from "@/components/tool-directory";
import { categories, tools } from "@/lib/tools";

export default function Home() {
  return (
    <>
      <SiteHeader />
      <main>
        <HeroSection />
        <StatsStrip />
        <ToolDirectory categories={categories} tools={tools} />
      </main>
      <SiteFooter />
    </>
  );
}
