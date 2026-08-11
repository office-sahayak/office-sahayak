import type { Metadata } from "next";
import { UrlShortenerWorkspace } from "@/components/online-tools-workspaces";
import { ToolPageShell } from "@/components/tool-page-shell";

export const metadata: Metadata = { title: "URL Shortener — Office Sahayak", description: "लंबे URL को छोटा is.gd link बनाएँ।" };

export default function UrlShortenerPage() {
  return <ToolPageShell title="URL Shortener" description="लंबे web link को छोटा, copy करने योग्य is.gd link बनाएँ और चाहें तो custom name चुनें।" icon="🔗" badge="मुफ़्त • तुरंत short link"><UrlShortenerWorkspace /></ToolPageShell>;
}
