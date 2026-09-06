import type { Metadata } from "next";
import { InfoPageShell } from "@/components/info-page-shell";

export const metadata: Metadata = {
  title: "उपयोग की शर्तें — Office Sahayak",
  description: "Office Sahayak के ऑनलाइन tools का उपयोग करने से संबंधित नियम और जिम्मेदारियाँ।",
};

export default function TermsPage() {
  return (
    <InfoPageShell title="उपयोग की शर्तें" intro="Office Sahayak का उपयोग करके आप नीचे दी गई शर्तों से सहमत होते हैं।">
      <section>
        <h2>स्वीकृत उपयोग</h2>
        <p className="mt-3">आप केवल उन files और जानकारियों को process करें जिनका उपयोग करने का आपको अधिकार है। गैरकानूनी, हानिकारक, भ्रामक, कॉपीराइट उल्लंघन करने वाली या किसी अन्य व्यक्ति की गोपनीयता भंग करने वाली सामग्री upload न करें।</p>
      </section>
      <section>
        <h2>परिणाम की जाँच</h2>
        <p className="mt-3">OCR, format conversion और calculations में तकनीकी सीमाओं के कारण त्रुटि हो सकती है। किसी सरकारी, कानूनी, वित्तीय या व्यावसायिक उपयोग से पहले तैयार file और परिणाम की स्वयं जाँच करना उपयोगकर्ता की जिम्मेदारी है।</p>
      </section>
      <section>
        <h2>सेवा की उपलब्धता</h2>
        <p className="mt-3">Maintenance, hosting limits, network समस्या या तकनीकी कारणों से सेवा अस्थायी रूप से धीमी या अनुपलब्ध हो सकती है। हम tools और usage limits में समय-समय पर बदलाव कर सकते हैं।</p>
      </section>
      <section>
        <h2>बौद्धिक संपदा</h2>
        <p className="mt-3">Office Sahayak का नाम, design और मूल website content सुरक्षित हैं। उपयोगकर्ता अपनी upload की गई files और उनसे बने output पर अपने लागू अधिकार बनाए रखते हैं।</p>
      </section>
    </InfoPageShell>
  );
}
