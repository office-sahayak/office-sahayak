import type { Metadata } from "next";
import { ImageFormatWorkspace } from "@/components/more-tools-workspaces";
import { ToolPageShell } from "@/components/tool-page-shell";

export const metadata: Metadata = { title: "Image Format Converter — Office Sahayak", description: "JPG, PNG और WebP image formats आपस में बदलें।" };

export default function ImageFormatConverterPage() {
  return <ToolPageShell title="Image Format Converter" description="JPG, PNG और WebP formats के बीच image बदलें—पूरी processing आपके browser में।" icon="🖼"><ImageFormatWorkspace /></ToolPageShell>;
}
