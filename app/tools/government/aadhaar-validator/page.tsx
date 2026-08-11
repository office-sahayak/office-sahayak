import type { Metadata } from "next";
import { AadhaarValidatorWorkspace } from "@/components/utility-tools-workspaces";
import { ToolPageShell } from "@/components/tool-page-shell";

export const metadata: Metadata = { title: "Aadhaar Checksum Checker — Office Sahayak", description: "Aadhaar number की 12-digit संरचना और Verhoeff checksum जाँचें।" };

export default function AadhaarValidatorPage() {
  return <ToolPageShell title="Aadhaar Checksum Checker" description="Aadhaar number की 12-digit संरचना और गणितीय checksum अपने browser में जाँचें।" icon="🪪"><AadhaarValidatorWorkspace /></ToolPageShell>;
}
