import type { Metadata } from "next";
import { InfoPageShell } from "@/components/info-page-shell";

export const metadata: Metadata = {
  title: "संपर्क — Office Sahayak",
  description: "Office Sahayak के tools में समस्या, सुझाव या त्रुटि की जानकारी भेजें।",
};

export default function ContactPage() {
  return (
    <InfoPageShell title="संपर्क" intro="किसी tool में समस्या, गलत परिणाम या सुधार का सुझाव हो तो नीचे दिए तरीके से जानकारी भेजें।">
      <section>
        <h2>सहायता कैसे माँगें</h2>
        <p className="mt-3">समस्या बताते समय tool का नाम, file type, browser और दिखाई देने वाला error लिखें। निजी या संवेदनशील file सार्वजनिक रूप से साझा न करें।</p>
      </section>
      <section>
        <h2>तकनीकी सहायता</h2>
        <p className="mt-3">आप Office Sahayak की GitHub repository पर issue दर्ज कर सकते हैं। इससे समस्या का विवरण और उसका समाधान व्यवस्थित रूप से track किया जा सकता है।</p>
        <a className="mt-4 inline-flex rounded-full bg-[#173f35] px-5 py-3 font-bold text-white hover:bg-[#102b24]" href="https://github.com/office-sahayak/office-sahayak/issues" rel="noreferrer" target="_blank">सहायता अनुरोध भेजें</a>
      </section>
      <section>
        <h2>जवाब का समय</h2>
        <p className="mt-3">हम उपलब्धता और समस्या की प्रकृति के अनुसार जवाब देने का प्रयास करते हैं। यह तत्काल सहायता या आपातकालीन सेवा नहीं है।</p>
      </section>
    </InfoPageShell>
  );
}
