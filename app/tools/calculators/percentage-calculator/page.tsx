import type { Metadata } from "next";
import { PercentageCalculatorWorkspace } from "@/components/basic-tools-workspaces";
import { ToolPageShell } from "@/components/tool-page-shell";

export const metadata: Metadata = {
  title: "प्रतिशत कैलकुलेटर — Office Sahayak",
  description: "प्रतिशत, अनुपात और प्रतिशत बढ़ोतरी या कमी की गणना करें।",
};

export default function PercentageCalculatorPage() {
  return (
    <ToolPageShell title="प्रतिशत कैलकुलेटर" description="किसी संख्या का प्रतिशत, दो संख्याओं का अनुपात और प्रतिशत बढ़ोतरी या कमी तुरंत निकालें।" icon="%">
      <PercentageCalculatorWorkspace />
    </ToolPageShell>
  );
}
