import type { Metadata } from "next";
import { WordToPdfWorkspace } from "@/components/document-converter-workspaces";
import { ToolPageShell } from "@/components/tool-page-shell";

export const metadata: Metadata = { title: "Word से PDF — Office Sahayak", description: "DOCX Word document को browser में PDF में बदलें।" };

export default function WordToPdfPage() {
  return <ToolPageShell title="Word से PDF" description="DOCX document का preview जाँचें और उसे Hindi, images तथा basic tables सहित PDF में download करें।" icon="📄"><WordToPdfWorkspace /></ToolPageShell>;
}
