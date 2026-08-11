import type { Metadata } from "next";
import { QrCodeWorkspace } from "@/components/more-tools-workspaces";
import { ToolPageShell } from "@/components/tool-page-shell";

export const metadata: Metadata = { title: "QR Code Generator — Office Sahayak", description: "Text या URL का रंगीन QR Code बनाकर PNG download करें।" };

export default function QrCodeGeneratorPage() {
  return <ToolPageShell title="QR Code Generator" description="URL, संदेश या अन्य text से साफ़, scan होने योग्य QR Code बनाकर PNG में download करें।" icon="▦"><QrCodeWorkspace /></ToolPageShell>;
}
