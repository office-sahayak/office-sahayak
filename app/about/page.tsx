import type { Metadata } from "next";
import Link from "next/link";
import { InfoPageShell } from "@/components/info-page-shell";

export const metadata: Metadata = {
  title: "हमारे बारे में — Office Sahayak",
  description: "Office Sahayak के उद्देश्य, उपलब्ध हिन्दी ऑनलाइन टूल्स और उपयोगकर्ता गोपनीयता के बारे में जानें।",
};

export default function AboutPage() {
  return (
    <InfoPageShell title="हमारे बारे में" intro="Office Sahayak रोज़मर्रा के कार्यालयीन और दस्तावेज़ संबंधी कामों को सरल बनाने के लिए तैयार किया गया हिन्दी ऑनलाइन टूल प्लेटफ़ॉर्म है।">
      <section>
        <h2>हमारा उद्देश्य</h2>
        <p className="mt-3">सरकारी कार्यालय, सहकारी संस्थाएँ, छोटे व्यवसाय, विद्यार्थी और सामान्य उपयोगकर्ता अक्सर PDF, Word, Excel, चित्र और हिन्दी फॉन्ट से जुड़े काम करते हैं। हमारा उद्देश्य इन कामों के लिए सरल, स्पष्ट और मोबाइल-अनुकूल टूल उपलब्ध कराना है।</p>
      </section>
      <section>
        <h2>हम क्या उपलब्ध कराते हैं</h2>
        <ul className="mt-3">
          <li>Word और Excel files को PDF में बदलने के टूल।</li>
          <li>PDF/JPG से editable हिन्दी Word बनाने की सुविधा।</li>
          <li>PDF merge, split और compress जैसे document tools।</li>
          <li>EMI, GST, प्रतिशत और आयु जैसे उपयोगी calculators।</li>
          <li>Image, text, QR code, barcode और अन्य दैनिक utilities।</li>
        </ul>
      </section>
      <section>
        <h2>सुरक्षा और पारदर्शिता</h2>
        <p className="mt-3">जहाँ संभव हो, processing आपके browser में होती है। Word और Excel से PDF conversion के लिए file हमारे server पर अस्थायी रूप से process होती है और conversion पूरा होने के बाद उसे स्थायी रूप से संग्रहित नहीं किया जाता। संवेदनशील दस्तावेज़ upload करने से पहले हमारी <Link className="font-bold text-[#173f35] underline" href="/privacy">गोपनीयता नीति</Link> पढ़ें।</p>
      </section>
    </InfoPageShell>
  );
}
