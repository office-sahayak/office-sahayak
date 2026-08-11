import type { Metadata } from "next";
import { PanValidatorWorkspace } from "@/components/utility-tools-workspaces";
import { ToolPageShell } from "@/components/tool-page-shell";

export const metadata: Metadata = { title: "PAN Format Checker — Office Sahayak", description: "PAN number का 10-character format और holder type जाँचें।" };

export default function PanValidatorPage() {
  return <ToolPageShell title="PAN Format Checker" description="PAN number का लिखने का format जाँचें और चौथे अक्षर से holder का प्रकार समझें।" icon="💳"><PanValidatorWorkspace /></ToolPageShell>;
}
