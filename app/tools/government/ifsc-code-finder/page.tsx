import type { Metadata } from "next";
import { IfscFinderWorkspace } from "@/components/online-tools-workspaces";
import { ToolPageShell } from "@/components/tool-page-shell";

export const metadata: Metadata = { title: "IFSC Code Finder — Office Sahayak", description: "IFSC code से bank और branch details खोजें।" };

export default function IfscFinderPage() {
  return <ToolPageShell title="IFSC Code Finder" description="11-character IFSC code लिखकर bank, branch, address, MICR और transfer facilities देखें।" icon="🏦" badge="मुफ़्त • Current bank data"><IfscFinderWorkspace /></ToolPageShell>;
}
