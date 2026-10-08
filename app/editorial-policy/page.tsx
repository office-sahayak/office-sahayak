import type { Metadata } from "next";
import Link from "next/link";
import { InfoPageShell } from "@/components/info-page-shell";

export const metadata: Metadata = {
  title: "संपादकीय नीति — Office Sahayak",
  description: "Office Sahayak के लेख, tool guidance, corrections, advertising और जिम्मेदारियों की संपादकीय नीति।",
  alternates: { canonical: "/editorial-policy" },
};

export default function EditorialPolicyPage() {
  return (
    <InfoPageShell title="संपादकीय नीति" intro="यह नीति बताती है कि Office Sahayak पर सहायता लेख और tool guidance कैसे तैयार, जाँचे और अपडेट किए जाते हैं।" updated="8 अक्टूबर 2026">
      <section>
        <h2>लेखों का उद्देश्य</h2>
        <p className="mt-3">हम document conversion, Hindi OCR, PDF, spreadsheet, scanning और calculators से जुड़े सामान्य office workflows को सरल हिन्दी में समझाते हैं। Content का लक्ष्य उपयोगकर्ता को input तैयार करने, सामान्य गलती पहचानने और output verify करने में मदद देना है—किसी सरकारी विभाग, bank या professional adviser की जगह लेना नहीं।</p>
      </section>
      <section>
        <h2>लेखन और समीक्षा</h2>
        <p className="mt-3">लेख Office Sahayak संपादकीय टीम द्वारा tool के वास्तविक workflow, सामान्य file-format behavior और उपयोगकर्ता की practical समस्याओं के आधार पर तैयार किए जाते हैं। प्रकाशन से पहले structure, भाषा, internal links, safety notes और तकनीकी consistency जाँची जाती है। लेख पर update date दी जाती है ताकि पाठक उसकी नवीनता समझ सके।</p>
      </section>
      <section>
        <h2>बदलने वाली जानकारी</h2>
        <p className="mt-3">Portal limits, tax rates, bank charges, eligibility, कानून और software behavior बदल सकते हैं। ऐसे मामलों में हम final decision से पहले संबंधित official notice, institution या qualified professional से पुष्टि करने को कहते हैं। Calculator result और OCR output को सहायक draft माना जाना चाहिए।</p>
      </section>
      <section>
        <h2>विज्ञापन और संपादकीय स्वतंत्रता</h2>
        <p className="mt-3">विज्ञापन से site के संचालन में सहायता मिल सकती है, लेकिन विज्ञापनदाता हमारे लेख के निष्कर्ष तय नहीं करते। Ads को tool controls या download buttons जैसा दिखाने का उद्देश्य नहीं है। उपयोगकर्ता विज्ञापन और Office Sahayak content में स्पष्ट अंतर देख सके, यह हमारी प्राथमिकता है।</p>
      </section>
      <section>
        <h2>Correction कैसे भेजें</h2>
        <p className="mt-3">यदि किसी लेख में तथ्यात्मक गलती, टूटा link या अस्पष्ट निर्देश दिखे तो लेख का URL और सही जानकारी हमारे <Link href="/contact" className="font-bold text-[#173f35] underline">संपर्क page</Link> से भेजें। सत्यापन के बाद जरूरी correction किया जाएगा और महत्वपूर्ण बदलाव पर update date बदली जाएगी।</p>
      </section>
      <section>
        <h2>गोपनीयता और संवेदनशील data</h2>
        <p className="mt-3">हम content में minimum-data practice को बढ़ावा देते हैं। Files की processing और retention की जानकारी के लिए <Link href="/privacy" className="font-bold text-[#173f35] underline">गोपनीयता नीति</Link> पढ़ें। Aadhaar, PAN, bank, medical या internal office record जैसे documents केवल स्पष्ट आवश्यकता और उचित अनुमति पर उपयोग करें।</p>
      </section>
    </InfoPageShell>
  );
}
