import type { Metadata } from "next";
import { WordCounterWorkspace } from "@/components/basic-tools-workspaces";
import { ToolPageShell } from "@/components/tool-page-shell";

export const metadata: Metadata = {
  title: "शब्द गिनती — Office Sahayak",
  description: "Hindi और English text में शब्द, अक्षर, वाक्य और पंक्तियाँ तुरंत गिनें।",
};

export default function WordCounterPage() {
  return (
    <ToolPageShell title="शब्द गिनती" description="Hindi या English text में शब्द, अक्षर, वाक्य, पंक्तियाँ और पढ़ने का अनुमानित समय तुरंत देखें।" icon="🔢">
      <WordCounterWorkspace />
    </ToolPageShell>
  );
}
