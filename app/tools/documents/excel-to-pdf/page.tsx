import type { Metadata } from "next";
import { ExcelToPdfWorkspace } from "@/components/document-converter-workspaces";
import { ToolPageShell } from "@/components/tool-page-shell";

export const metadata: Metadata = { title: "Excel से PDF — Office Sahayak", description: "XLSX Excel sheet को LibreOffice engine से सही print layout वाली PDF में बदलें।" };

export default function ExcelToPdfPage() {
  return <ToolPageShell title="Excel से PDF" description="XLSX workbook की sheet चुनें और Excel की saved print settings के अनुसार PDF download करें।" icon="📊"><ExcelToPdfWorkspace /></ToolPageShell>;
}
