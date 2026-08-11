import type { Metadata } from "next";
import { PdfCompressWorkspace } from "@/components/pdf-compress-workspace";
import { ToolPageShell } from "@/components/tool-page-shell";

export const metadata: Metadata = { title: "PDF Compress — Office Sahayak", description: "PDF का file size browser में कम करें।" };

export default function PdfCompressPage() {
  return <ToolPageShell title="PDF Compress" description="PDF की quality और readability नियंत्रित करके file size कम करें—बिना server upload के।" icon="🗜"><PdfCompressWorkspace /></ToolPageShell>;
}
