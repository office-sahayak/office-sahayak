import type { Metadata } from "next";
import { WordToPdfWorkspace } from "@/components/document-converter-workspaces";
import { ToolPageShell } from "@/components/tool-page-shell";

export const metadata: Metadata = { title: "Word से PDF — Office Sahayak", description: "DOCX Word document को LibreOffice engine से सही tables और page layout वाली PDF में बदलें।" };

export default function WordToPdfPage() {
  return <ToolPageShell title="Word से PDF" description="DOCX document का preview जाँचें और Word की saved page settings के अनुसार PDF download करें।" icon="📄"><WordToPdfWorkspace /></ToolPageShell>;
}
