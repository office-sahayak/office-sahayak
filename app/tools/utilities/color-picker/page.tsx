import type { Metadata } from "next";
import { ColorPickerWorkspace } from "@/components/more-tools-workspaces";
import { ToolPageShell } from "@/components/tool-page-shell";

export const metadata: Metadata = { title: "Color Picker — Office Sahayak", description: "रंग चुनें और HEX, RGB तथा HSL code copy करें।" };

export default function ColorPickerPage() {
  return <ToolPageShell title="Color Picker" description="अपना रंग चुनें, live preview देखें और HEX, RGB या HSL code एक click में copy करें।" icon="🎨"><ColorPickerWorkspace /></ToolPageShell>;
}
