import type { Metadata } from "next";
import { InfoPageShell } from "@/components/info-page-shell";

export const metadata: Metadata = {
  title: "अस्वीकरण — Office Sahayak",
  description: "Office Sahayak tools और उनके परिणामों से संबंधित महत्वपूर्ण अस्वीकरण।",
};

export default function DisclaimerPage() {
  return (
    <InfoPageShell title="अस्वीकरण" intro="Office Sahayak उपयोगी digital tools उपलब्ध कराता है, लेकिन यह किसी सरकारी विभाग, बैंक या पेशेवर सलाह सेवा का आधिकारिक प्रतिनिधि नहीं है।">
      <section>
        <h2>सामान्य जानकारी</h2>
        <p className="mt-3">Website पर उपलब्ध calculators, converters और जानकारी सामान्य सुविधा के लिए हैं। इन्हें कानूनी, कर, वित्तीय, चिकित्सा या अन्य पेशेवर सलाह का विकल्प न मानें।</p>
      </section>
      <section>
        <h2>OCR और conversion की सीमाएँ</h2>
        <p className="mt-3">धुंधली scan, असामान्य font, complex tables, damaged file या unsupported formatting के कारण output में अक्षर, संख्या, alignment या page layout बदल सकता है। महत्वपूर्ण दस्तावेज़ का output मूल file से मिलाकर अवश्य देखें।</p>
      </section>
      <section>
        <h2>बाहरी links और विज्ञापन</h2>
        <p className="mt-3">Website पर तृतीय-पक्ष links या विज्ञापन दिखाई दे सकते हैं। उन websites, products या services की सामग्री, उपलब्धता और policies के लिए संबंधित प्रदाता जिम्मेदार होगा।</p>
      </section>
    </InfoPageShell>
  );
}
