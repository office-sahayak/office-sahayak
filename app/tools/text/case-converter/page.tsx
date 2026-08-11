import type { Metadata } from "next";
import { CaseConverterWorkspace } from "@/components/basic-tools-workspaces";
import { ToolPageShell } from "@/components/tool-page-shell";

export const metadata: Metadata = {
  title: "Case Converter — Office Sahayak",
  description: "English text को uppercase, lowercase, Title Case या Sentence case में बदलें।",
};

export default function CaseConverterPage() {
  return (
    <ToolPageShell title="Case Converter" description="English text को UPPERCASE, lowercase, Title Case या Sentence case में एक click में बदलें।" icon="🔠">
      <CaseConverterWorkspace />
    </ToolPageShell>
  );
}
