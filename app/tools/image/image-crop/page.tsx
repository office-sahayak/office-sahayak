import type { Metadata } from "next";
import { ImageCropWorkspace } from "@/components/utility-tools-workspaces";
import { ToolPageShell } from "@/components/tool-page-shell";

export const metadata: Metadata = { title: "Image Crop — Office Sahayak", description: "JPG, PNG या WebP image को pixels के अनुसार crop करें।" };

export default function ImageCropPage() {
  return <ToolPageShell title="Image Crop" description="Image का जरूरी हिस्सा X, Y, width और height के अनुसार काटकर नया photo download करें।" icon="✂️"><ImageCropWorkspace /></ToolPageShell>;
}
