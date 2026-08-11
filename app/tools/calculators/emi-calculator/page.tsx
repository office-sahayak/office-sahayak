import type { Metadata } from "next";
import { EmiCalculatorWorkspace } from "@/components/basic-tools-workspaces";
import { ToolPageShell } from "@/components/tool-page-shell";

export const metadata: Metadata = {
  title: "EMI कैलकुलेटर — Office Sahayak",
  description: "लोन की मासिक EMI, कुल ब्याज और कुल भुगतान की गणना करें।",
};

export default function EmiCalculatorPage() {
  return (
    <ToolPageShell title="EMI कैलकुलेटर" description="लोन राशि, ब्याज दर और अवधि भरकर मासिक EMI, कुल ब्याज तथा कुल भुगतान तुरंत जानें।" icon="💰">
      <EmiCalculatorWorkspace />
    </ToolPageShell>
  );
}
