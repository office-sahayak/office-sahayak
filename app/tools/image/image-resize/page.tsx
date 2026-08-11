import type { Metadata } from "next";
import { ImageResizeWorkspace } from "@/components/more-tools-workspaces";
import { ToolPageShell } from "@/components/tool-page-shell";

export const metadata: Metadata = { title: "Image Resize — Office Sahayak", description: "Image की width और height pixels में बदलें।" };

export default function ImageResizePage() {
  return <ToolPageShell title="Image Resize" description="JPG, PNG या WebP photo की चौड़ाई और ऊँचाई बदलें तथा नया image download करें।" icon="📏"><ImageResizeWorkspace /></ToolPageShell>;
}
