import type { Metadata } from "next";
import { ExcelToPdfWorkspace } from "@/components/document-converter-workspaces";
import { ToolPageShell } from "@/components/tool-page-shell";

export const metadata: Metadata = { title: "Excel से PDF — Office Sahayak", description: "XLSX Excel sheet को browser में PDF में बदलें।" };

export default function ExcelToPdfPage() {
  return <ToolPageShell title="Excel से PDF" description="XLSX workbook की sheet चुनें, table preview देखें और portrait या landscape PDF download करें।" icon="📊"><ExcelToPdfWorkspace /></ToolPageShell>;
}
