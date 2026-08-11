import type { Metadata } from "next";
import { ImageCompressWorkspace } from "@/components/more-tools-workspaces";
import { ToolPageShell } from "@/components/tool-page-shell";

export const metadata: Metadata = { title: "Image Compress — Office Sahayak", description: "JPG, PNG या WebP image का file size browser में कम करें।" };

export default function ImageCompressPage() {
  return <ToolPageShell title="Image Compress" description="Photo की quality और dimensions नियंत्रित करके file size छोटा करें—बिना server upload के।" icon="🗜"><ImageCompressWorkspace /></ToolPageShell>;
}
