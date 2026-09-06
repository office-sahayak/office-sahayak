import type { Metadata } from "next";
import { InfoPageShell } from "@/components/info-page-shell";

export const metadata: Metadata = {
  title: "गोपनीयता नीति — Office Sahayak",
  description: "Office Sahayak पर files, cookies, analytics और विज्ञापन से संबंधित गोपनीयता जानकारी।",
};

export default function PrivacyPage() {
  return (
    <InfoPageShell title="गोपनीयता नीति" intro="यह नीति बताती है कि Office Sahayak का उपयोग करते समय कौन-सी जानकारी process हो सकती है और आपकी files के साथ कैसे व्यवहार किया जाता है।">
      <section>
        <h2>Files और दस्तावेज़</h2>
        <p className="mt-3">कई tools आपके browser में ही काम करते हैं। Word और Excel से PDF conversion जैसे server-based tools में upload की गई file केवल conversion के लिए अस्थायी रूप से process की जाती है। हम इन files को उपयोगकर्ता खाते या स्थायी document library में संग्रहित नहीं करते। फिर भी अत्यधिक गोपनीय, वित्तीय, चिकित्सकीय या पहचान संबंधी दस्तावेज़ upload करने से पहले सावधानी रखें।</p>
      </section>
      <section>
        <h2>तकनीकी जानकारी</h2>
        <p className="mt-3">Service की सुरक्षा, त्रुटि पहचान और प्रदर्शन सुधारने के लिए hosting provider सामान्य server logs, IP address, browser type, request time और requested page जैसी सीमित तकनीकी जानकारी process कर सकता है।</p>
      </section>
      <section>
        <h2>Cookies, analytics और विज्ञापन</h2>
        <p className="mt-3">हम उपयोग अनुभव समझने, website traffic मापने और भविष्य में विज्ञापन दिखाने के लिए cookies या समान तकनीक का उपयोग कर सकते हैं। Google सहित तृतीय-पक्ष विज्ञापन प्रदाता उपयोगकर्ता के browser में cookies पढ़ या रख सकते हैं, अथवा विज्ञापन सेवा के लिए web beacons और IP address का उपयोग कर सकते हैं। जहाँ कानूनन आवश्यक हो, consent विकल्प उपलब्ध कराया जाएगा।</p>
      </section>
      <section>
        <h2>तृतीय-पक्ष सेवाएँ</h2>
        <p className="mt-3">Website hosting, fonts, analytics, विज्ञापन या payment जैसी सुविधाओं के लिए तृतीय-पक्ष सेवाएँ उपयोग की जा सकती हैं। ऐसी सेवाओं पर उनकी अपनी privacy policies लागू होती हैं।</p>
      </section>
      <section>
        <h2>नीति में बदलाव</h2>
        <p className="mt-3">Website या कानूनी आवश्यकताओं में बदलाव होने पर यह नीति अपडेट की जा सकती है। नया संस्करण इसी page पर अंतिम अपडेट की तारीख के साथ प्रकाशित किया जाएगा।</p>
      </section>
    </InfoPageShell>
  );
}
