import type { Metadata } from "next";
import { AgeCalculatorWorkspace } from "@/components/basic-tools-workspaces";
import { ToolPageShell } from "@/components/tool-page-shell";

export const metadata: Metadata = {
  title: "उम्र कैलकुलेटर — Office Sahayak",
  description: "जन्म तारीख से वर्ष, महीने और दिन में सटीक उम्र निकालें।",
};

export default function AgeCalculatorPage() {
  return (
    <ToolPageShell title="उम्र कैलकुलेटर" description="जन्म तारीख से किसी भी चुनी हुई तारीख तक वर्ष, महीने और दिन में सटीक उम्र जानें।" icon="🎂">
      <AgeCalculatorWorkspace />
    </ToolPageShell>
  );
}
