import type { Metadata } from "next";
import { GstCalculatorWorkspace } from "@/components/basic-tools-workspaces";
import { ToolPageShell } from "@/components/tool-page-shell";

export const metadata: Metadata = {
  title: "GST कैलकुलेटर — Office Sahayak",
  description: "राशि में GST जोड़ें या GST सहित राशि से tax अलग करें।",
};

export default function GstCalculatorPage() {
  return (
    <ToolPageShell title="GST कैलकुलेटर" description="राशि में GST जोड़ें या GST सहित कुल राशि से मूल मूल्य, CGST और SGST अलग निकालें।" icon="🧾">
      <GstCalculatorWorkspace />
    </ToolPageShell>
  );
}
