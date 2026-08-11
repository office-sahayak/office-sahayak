import type { Metadata } from "next";
import { PasswordGeneratorWorkspace } from "@/components/more-tools-workspaces";
import { ToolPageShell } from "@/components/tool-page-shell";

export const metadata: Metadata = { title: "Password Generator — Office Sahayak", description: "अपने browser में मजबूत random password बनाएँ।" };

export default function PasswordGeneratorPage() {
  return <ToolPageShell title="Password Generator" description="अपनी पसंद की लंबाई और अक्षरों के साथ सुरक्षित random password तुरंत बनाएँ।" icon="🔑"><PasswordGeneratorWorkspace /></ToolPageShell>;
}
