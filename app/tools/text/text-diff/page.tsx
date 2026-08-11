import type { Metadata } from "next";
import { TextDiffWorkspace } from "@/components/more-tools-workspaces";
import { ToolPageShell } from "@/components/tool-page-shell";

export const metadata: Metadata = { title: "टेक्स्ट तुलना — Office Sahayak", description: "दो text या documents की पंक्तियों का अंतर तुरंत देखें।" };

export default function TextDiffPage() {
  return <ToolPageShell title="टेक्स्ट तुलना" description="दो versions को साथ रखकर समान, बदली, जोड़ी और हटाई गई पंक्तियाँ आसानी से पहचानें।" icon="🔍"><TextDiffWorkspace /></ToolPageShell>;
}
