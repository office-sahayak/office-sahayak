import type { Metadata } from "next";
import { BarcodeGeneratorWorkspace } from "@/components/utility-tools-workspaces";
import { ToolPageShell } from "@/components/tool-page-shell";

export const metadata: Metadata = { title: "Barcode Generator — Office Sahayak", description: "CODE 128, CODE 39, EAN-13 या UPC barcode बनाएँ।" };

export default function BarcodeGeneratorPage() {
  return <ToolPageShell title="Barcode Generator" description="Text या product number से CODE 128, CODE 39, EAN-13 या UPC barcode बनाकर SVG download करें।" icon="🏷"><BarcodeGeneratorWorkspace /></ToolPageShell>;
}
