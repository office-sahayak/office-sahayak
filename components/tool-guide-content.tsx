interface ToolGuide {
  intro: string;
  steps: string[];
  tips: string[];
  faqs: Array<{ question: string; answer: string }>;
}

const guides: Record<string, ToolGuide> = {
  "PDF/JPG से Editable Hindi Word": {
    intro: "यह टूल स्कैन की हुई हिन्दी PDF या साफ़ document photo से text पहचानकर editable Word file तैयार करता है। परिणाम Kruti Dev 010 और DevLys 010 में लिया जा सकता है, इसलिए पुराने कार्यालयीन format में सुधार, copy और दोबारा typing करना आसान रहता है। OCR मशीन से पढ़ता है, इसलिए अंतिम file download करने से पहले नाम, तारीख, अंक और तालिका अवश्य जाँचें।",
    steps: ["साफ़ PDF, JPG या PNG चुनें; फोटो सीधा और पर्याप्त रोशनी वाला रखें।", "पहचाने गए text और table preview में आवश्यक सुधार करें।", "चाहे गए font format में Word file बनाएँ और Microsoft Word में अंतिम जाँच करें।"],
    tips: ["धुंधली, तिरछी या बहुत छोटी लिखावट OCR accuracy कम करती है।", "सरकारी पत्रों में राशि, वर्ष, मोबाइल नंबर और आदेश क्रमांक मूल document से मिलाएँ।", "Kruti Dev/DevLys file सही देखने के लिए वही font computer में installed होना चाहिए।"],
    faqs: [
      { question: "क्या output पूरी तरह editable रहता है?", answer: "हाँ, पहचाना गया text और बनाई गई tables Word में edit की जा सकती हैं; image-only scan editable नहीं होता, इसलिए OCR conversion किया जाता है।" },
      { question: "गलत अक्षर आने पर क्या करें?", answer: "Preview में अक्षर सुधारें, बेहतर quality की scan दोबारा दें और final Word file को मूल document से line-by-line मिलाएँ।" },
    ],
  },
  "PDF मर्ज": {
    intro: "PDF मर्ज से अलग-अलग आवेदन, प्रमाणपत्र, annexure या scan को सही क्रम में एक document बनाया जा सकता है। Processing browser में होती है, इसलिए सामान्य merge के लिए files server पर भेजने की आवश्यकता नहीं पड़ती। Final PDF बनाने से पहले page order जाँचना जरूरी है।",
    steps: ["दो या अधिक PDF files चुनें।", "Files को आवश्यक क्रम में ऊपर-नीचे व्यवस्थित करें।", "Merge करके बनी PDF download करें और पहला व अंतिम page खोलकर जाँचें।"],
    tips: ["एक ही विषय की files को पहले स्पष्ट नाम दें।", "Password-protected या खराब PDF merge न हो तो उसे पहले खोलकर नई copy save करें।", "बहुत बड़ी files के लिए browser memory पर्याप्त रखें और दूसरे भारी tabs बंद करें।"],
    faqs: [
      { question: "क्या merge करने से pages की quality घटती है?", answer: "सामान्यतः pages को बिना दोबारा rasterize किए जोड़ा जाता है, इसलिए मूल quality बनी रहती है।" },
      { question: "क्या अलग आकार के pages जोड़े जा सकते हैं?", answer: "हाँ, A4 और अन्य आकार साथ जोड़े जा सकते हैं; final PDF में हर page अपना मूल आकार रख सकता है।" },
    ],
  },
  "PDF स्प्लिट": {
    intro: "PDF स्प्लिट का उपयोग किसी बड़े document से जरूरी pages निकालने या हर page की अलग PDF बनाने के लिए करें। इससे पूरी file भेजने के बजाय केवल संबंधित आदेश, प्रमाणपत्र या annexure साझा किया जा सकता है। Download के बाद page संख्या और content की जाँच करें।",
    steps: ["PDF चुनकर उसके pages load होने दें।", "चुने हुए pages निकालें या सभी pages अलग करने का विकल्प चुनें।", "Output download करके page क्रम और readability जाँचें।"],
    tips: ["Page range चुनते समय PDF viewer की संख्या देखें, printed page number अलग हो सकता है।", "गोपनीय document से केवल जरूरी pages साझा करें।", "Digital signature वाली PDF को split करने पर signature validity बदल सकती है।"],
    faqs: [
      { question: "क्या एक से अधिक page एक नई PDF में निकाले जा सकते हैं?", answer: "हाँ, आवश्यक pages या range चुनकर उन्हें एक अलग PDF में रखा जा सकता है।" },
      { question: "क्या मूल PDF बदलती है?", answer: "नहीं, browser नई output file बनाता है; आपकी मूल file वैसी ही रहती है।" },
    ],
  },
  "PDF Compress": {
    intro: "PDF Compress email, portal upload या WhatsApp sharing के लिए file size घटाने में मदद करता है। Compression में size और readability के बीच संतुलन जरूरी है—बहुत अधिक compression छोटे अक्षरों, मुहर और हस्ताक्षर को धुंधला कर सकती है।",
    steps: ["PDF चुनें और उपलब्ध quality setting निर्धारित करें।", "Compressed preview या अनुमानित size देखें।", "नई PDF download करके zoom पर text, seal और signature जाँचें।"],
    tips: ["पहले मध्यम compression आजमाएँ।", "कानूनी या scan document की original copy अलग सुरक्षित रखें।", "Portal की MB limit के अनुसार ही quality घटाएँ।"],
    faqs: [
      { question: "Size कितना कम होगा?", answer: "यह PDF में मौजूद images, scans और पहले से हुई compression पर निर्भर करता है; text-only PDF में कमी कम हो सकती है।" },
      { question: "क्या original file delete होती है?", answer: "नहीं, compressed file अलग download होती है और original आपके device पर सुरक्षित रहती है।" },
    ],
  },
  "Word से PDF": {
    intro: "Word से PDF conversion document का page layout स्थिर करता है, ताकि दूसरे device पर font, table और page break यथासंभव समान दिखाई दें। यह tool DOCX को LibreOffice engine से convert करता है। सही परिणाम के लिए document में प्रयुक्त fonts उपलब्ध होना और Word में page settings पहले से सही होना आवश्यक है।",
    steps: ["DOCX file चुनें और preview/load पूरा होने दें।", "Page size, margins, tables और headings की जाँच करें।", "PDF बनाएँ और download के बाद सभी pages विशेषकर अंतिम page देखें।"],
    tips: ["Word में A4, margins और orientation पहले सेट करें।", "Rare font इस्तेमाल हो तो उसे standard font से बदलें या server पर font उपलब्ध होने की पुष्टि करें।", "Track Changes, comments और hidden content को भेजने से पहले साफ़ करें।"],
    faqs: [
      { question: "Table का layout क्यों बदल सकता है?", answer: "Missing font, fixed row height या अलग page margin के कारण text reflow हो सकता है; DOCX में table width और page size जाँचें।" },
      { question: "क्या पुरानी DOC file चलेगी?", answer: "Tool मुख्यतः DOCX के लिए है; पुरानी DOC file को पहले Word या LibreOffice में DOCX के रूप में save करें।" },
    ],
  },
  "Excel से PDF": {
    intro: "Excel से PDF tool workbook की saved print settings के आधार पर sheet को PDF में बदलता है। Wide tables, repeat headings, print area और page orientation Excel में सही होने पर output अधिक साफ़ आता है। Conversion से पहले अनावश्यक खाली cells और stray data हटाना उपयोगी रहता है।",
    steps: ["XLSX workbook चुनें और आवश्यक sheet तय करें।", "Excel में बने print area, orientation और scaling को preview से मिलाएँ।", "PDF download करके columns, totals, borders और page headings जाँचें।"],
    tips: ["चौड़ी table के लिए Landscape और Fit to Width उपयोग करें।", "हर page पर heading चाहिए तो Excel में Print Titles सेट करें।", "बहुत दूर के किसी cell में space या अक्षर होने से print range बढ़ सकती है।"],
    faqs: [
      { question: "Columns दबे हुए क्यों दिखते हैं?", answer: "Sheet की column width, scaling या print area गलत होने पर ऐसा हो सकता है; Excel में Page Layout settings सुधारें।" },
      { question: "क्या formulas PDF में calculate होंगे?", answer: "PDF में calculated values दिखती हैं; workbook को upload से पहले Excel में खोलकर formulas recalculate और save करें।" },
    ],
  },
  "Image Compress": {
    intro: "Image Compress फोटो की dimensions और quality घटाकर file size कम करता है। यह online form, email attachment और website upload में उपयोगी है। Processing browser में होती है; फिर भी output की स्पष्टता जाँचकर ही original हटाएँ।",
    steps: ["JPG, PNG या WebP image चुनें।", "Quality/dimensions समायोजित करके preview देखें।", "छोटी file download करें और text या चेहरे की स्पष्टता जाँचें।"],
    tips: ["Document photo में text पढ़ने योग्य रखना size से अधिक महत्वपूर्ण है।", "PNG screenshot को WebP/JPG करने से size काफी घट सकता है।", "Original photo की backup copy रखें।"],
    faqs: [
      { question: "क्या फोटो server पर upload होती है?", answer: "इस tool की image processing browser में होती है, इसलिए सामान्य उपयोग में image conversion आपके device पर ही किया जाता है।" },
      { question: "PNG की transparency बचेगी?", answer: "PNG/WebP output transparency रख सकता है; JPG transparency को background color में बदल देता है।" },
    ],
  },
  "Image Resize": {
    intro: "Image Resize से photo की pixel width और height बदली जा सकती है। सरकारी portal, profile photo, thumbnail या document attachment के लिए निर्धारित dimensions पाने में यह उपयोगी है। केवल file size कम करना हो तो Compress tool बेहतर हो सकता है।",
    steps: ["Image चुनें और उसकी मौजूदा dimensions देखें।", "नई width/height भरें और aspect ratio बनाए रखने का विकल्प उपयोग करें।", "Resized image download कर उसकी dimensions और clarity जाँचें।"],
    tips: ["Aspect ratio lock रखने से फोटो खिंची हुई नहीं दिखेगी।", "छोटी image को बहुत बड़ा करने से detail वापस नहीं आती।", "Portal में pixel और KB दोनों limit अलग-अलग जाँचें।"],
    faqs: [
      { question: "Resize और compress में क्या अंतर है?", answer: "Resize pixels की चौड़ाई-ऊँचाई बदलता है; compress quality/encoding बदलकर file size कम करता है।" },
      { question: "Passport photo के लिए इस्तेमाल कर सकते हैं?", answer: "हाँ, यदि portal की exact pixel और file-size requirement पता हो; crop और resize दोनों की जरूरत पड़ सकती है।" },
    ],
  },
  "Image Crop": {
    intro: "Image Crop से फोटो का अनावश्यक किनारा हटाकर केवल जरूरी भाग रखा जाता है। Scan में खाली border हटाने, document सीधा दिखाने या profile photo का framing सुधारने में इसका उपयोग करें। Crop के बाद important text या मुहर कट न जाए, यह अवश्य देखें।",
    steps: ["Image चुनें और crop area निर्धारित करें।", "Preview में चारों किनारे और जरूरी content जाँचें।", "Cropped image download करके full size पर खोलें।"],
    tips: ["Document के चारों कोने थोड़ी margin सहित रखें।", "Profile photo में सिर और कंधे संतुलित रखें।", "Crop के बाद portal की required dimensions के लिए Resize tool उपयोग करें।"],
    faqs: [
      { question: "क्या crop से quality घटती है?", answer: "Crop केवल चुना area रखता है; output format/encoding के आधार पर हल्का quality change हो सकता है।" },
      { question: "गलत crop हो जाए तो?", answer: "Original file नहीं बदलती; उसे दोबारा चुनकर नया crop बनाया जा सकता है।" },
    ],
  },
  "Image Format Converter": {
    intro: "Image Format Converter JPG, PNG और WebP के बीच image बदलता है। सही format चुनने से compatibility, transparency और file size बेहतर हो सकते हैं। Document portal के लिए आमतौर पर JPG, transparent graphic के लिए PNG और web use के लिए WebP उपयोगी होता है।",
    steps: ["Source image चुनें।", "Required output format और उपलब्ध quality विकल्प चुनें।", "Converted image download करके उसे target app या portal में खोलकर देखें।"],
    tips: ["JPG transparency support नहीं करता।", "बार-बार lossy JPG conversion से quality घट सकती है।", "Portal कौन-सा extension स्वीकार करता है, पहले पढ़ें।"],
    faqs: [
      { question: "कौन-सा format सबसे छोटा है?", answer: "अक्सर WebP छोटा होता है, लेकिन result image और quality पर निर्भर करता है; compatibility के लिए JPG अधिक स्वीकार्य है।" },
      { question: "क्या file का नाम बदलने से format बदल जाता है?", answer: "नहीं, extension rename करना पर्याप्त नहीं; वास्तविक encoding बदलने के लिए converter जरूरी है।" },
    ],
  },
  "EMI कैलकुलेटर": {
    intro: "EMI कैलकुलेटर loan amount, annual interest rate और अवधि से अनुमानित मासिक किस्त, कुल ब्याज और कुल भुगतान बताता है। यह तुलना और प्रारंभिक planning के लिए है; bank की processing fee, insurance, floating-rate बदलाव और rounding के कारण वास्तविक schedule अलग हो सकता है।",
    steps: ["वास्तविक loan principal भरें।", "वार्षिक ब्याज दर और अवधि सही unit में दर्ज करें।", "EMI के साथ कुल ब्याज देखकर अलग-अलग अवधि की तुलना करें।"],
    tips: ["कम EMI हमेशा सस्ता loan नहीं होती; लंबी अवधि में कुल ब्याज बढ़ सकता है।", "Processing fee और prepayment rules अलग से जोड़कर सोचें।", "Final निर्णय bank के sanction letter और repayment schedule पर करें।"],
    faqs: [
      { question: "यह flat rate है या reducing balance?", answer: "सामान्य EMI calculation reducing-balance formula पर आधारित होती है; lender की method अलग हो तो परिणाम बदल सकता है।" },
      { question: "Floating rate बदलने पर क्या होगा?", answer: "भविष्य की rate change EMI या tenure बदल सकती है; नई rate डालकर revised estimate निकालें।" },
    ],
  },
  "GST कैलकुलेटर": {
    intro: "GST कैलकुलेटर किसी base amount में GST जोड़ने या GST-inclusive कुल राशि से taxable value और tax अलग निकालने में मदद करता है। यह arithmetic सहायता है; सही GST rate, place of supply, HSN/SAC और tax treatment के लिए invoice तथा लागू नियम देखें।",
    steps: ["Inclusive या exclusive calculation चुनें।", "Amount और लागू GST प्रतिशत भरें।", "CGST/SGST या कुल tax result को invoice से मिलाएँ।"],
    tips: ["Inter-state supply में IGST और intra-state में CGST/SGST लागू हो सकता है।", "Rate अनुमान से न चुनें; product/service की वर्तमान rate जाँचें।", "Rounding और discount invoice policy के अनुसार रखें।"],
    faqs: [
      { question: "GST सहित price से मूल कीमत कैसे निकलती है?", answer: "Inclusive mode कुल राशि और rate से taxable value तथा tax भाग अलग करता है।" },
      { question: "क्या यह tax advice देता है?", answer: "नहीं, यह calculation tool है; classification या filing के लिए tax professional/official GST guidance लें।" },
    ],
  },
  "प्रतिशत कैलकुलेटर": {
    intro: "प्रतिशत कैलकुलेटर किसी संख्या का percentage, दो values का अनुपात और increase/decrease निकालता है। इसका उपयोग परीक्षा अंक, discount, growth, attendance और office reports में किया जा सकता है। सही calculation के लिए base value पहचानना सबसे महत्वपूर्ण है।",
    steps: ["जरूरत के अनुसार percentage, ratio या change वाला विकल्प चुनें।", "दोनों values सही क्रम में भरें।", "Result को context सहित लिखें—किस value का कितना प्रतिशत है।"],
    tips: ["Percentage change में पुरानी value denominator होती है।", "शून्य base से percentage change परिभाषित नहीं होता।", "रिपोर्ट में decimal rounding का नियम समान रखें।"],
    faqs: [
      { question: "20% discount के बाद price कैसे निकालें?", answer: "मूल price का 20% निकालकर मूल price से घटाएँ; calculator में percentage amount उपयोग करें।" },
      { question: "Percentage और percentage point अलग हैं?", answer: "हाँ, 20% से 25% जाना 5 percentage points है, जबकि relative increase 25% है।" },
    ],
  },
  "उम्र कैलकुलेटर": {
    intro: "उम्र कैलकुलेटर जन्म तारीख से चुनी तारीख तक पूरे वर्ष, महीने और दिन बताता है। भर्ती, school form या eligibility में cutoff date अलग हो सकती है, इसलिए आज की तारीख के बजाय notification में दी गई calculation date चुनें।",
    steps: ["Date of birth calendar से सही चुनें।", "आज या संबंधित cutoff date निर्धारित करें।", "Result को original birth certificate/marksheet से मिलाएँ।"],
    tips: ["DD/MM/YYYY और MM/DD/YYYY की गड़बड़ी से बचें।", "Leap year में भी calendar-based calculation उपयोग करें।", "Official eligibility के लिए संबंधित विभाग का age rule अंतिम होगा।"],
    faqs: [
      { question: "क्या उम्र केवल पूरे वर्षों में मिलती है?", answer: "Tool वर्ष, महीने और दिन का विस्तृत अंतर दिखाता है।" },
      { question: "सरकारी भर्ती में कौन-सी तारीख डालें?", answer: "Notification में दी गई cutoff date डालें; केवल आज की उम्र eligibility तय नहीं करती।" },
    ],
  },
  "Case Converter": {
    intro: "Case Converter English text को uppercase, lowercase, Title Case या Sentence case में बदलता है। यह headings, spreadsheet data और copied text की formatting जल्दी समान करने में उपयोगी है। नाम और abbreviations को output के बाद manual review करना चाहिए।",
    steps: ["Text paste या type करें।", "आवश्यक case format चुनें।", "Converted text copy कर destination document में जाँचें।"],
    tips: ["Title Case में छोटे connecting words का style संस्था के नियम पर निर्भर हो सकता है।", "PAN, GSTIN, IFSC जैसे abbreviations uppercase रखें।", "Hindi अक्षरों पर English case conversion लागू नहीं होता।"],
    faqs: [
      { question: "Sentence case क्या करता है?", answer: "यह वाक्य की शुरुआत को capital और बाकी text को सामान्य case में व्यवस्थित करने का प्रयास करता है।" },
      { question: "क्या formatting जैसे bold भी copy होगी?", answer: "यह plain text case बदलता है; rich-text formatting destination editor पर निर्भर करती है।" },
    ],
  },
  "शब्द गिनती": {
    intro: "शब्द गिनती tool Hindi और English text में words, characters, sentences, lines और अनुमानित reading time दिखाता है। आवेदन, लेख, नोटशीट और social post की सीमा जाँचने में यह उपयोगी है। अलग platforms spaces और emojis को अलग तरह से गिन सकते हैं।",
    steps: ["Text box में सामग्री paste करें।", "Word, character और sentence counts देखें।", "Limit के अनुसार edit करके count दोबारा जाँचें।"],
    tips: ["Characters with spaces और without spaces अलग हो सकते हैं।", "Hyphenated शब्द की counting tool/platform के अनुसार बदल सकती है।", "Reading time केवल सामान्य गति का अनुमान है।"],
    faqs: [
      { question: "Hindi शब्द सही गिने जाते हैं?", answer: "Tool whitespace और text boundaries के आधार पर Hindi/English दोनों गिनता है; विशेष punctuation में थोड़ा अंतर संभव है।" },
      { question: "क्या text save होता है?", answer: "यह workspace browser में calculation करता है; संवेदनशील text paste करने से पहले privacy policy और device security का ध्यान रखें।" },
    ],
  },
  "टेक्स्ट तुलना": {
    intro: "टेक्स्ट तुलना दो versions के बीच जोड़ी, हटाई और बदली गई पंक्तियाँ पहचानने में मदद करती है। Draft letter, आदेश, agreement या code के revisions जाँचने में यह उपयोगी है। केवल रंग देखकर निर्णय न लें—महत्वपूर्ण बदलाव का अर्थ भी पढ़ें।",
    steps: ["पुराना text बाएँ और नया text दाएँ रखें।", "Compare चलाकर changed lines देखें।", "महत्वपूर्ण नाम, तारीख, राशि और शर्तें manually verify करें।"],
    tips: ["Formatting और extra spaces भी difference बना सकते हैं।", "लंबे document को section-wise compare करना आसान रहता है।", "Legal document में final review जिम्मेदार अधिकारी/विशेषज्ञ से कराएँ।"],
    faqs: [
      { question: "क्या Word files सीधे compare होती हैं?", answer: "यह tool plain text तुलना के लिए है; Word content को copy करके डालें या Word का Track Changes उपयोग करें।" },
      { question: "लाइन क्रम बदलने पर क्या होगा?", answer: "Moved lines कई additions/deletions की तरह दिख सकती हैं; section headings के आधार पर manual review करें।" },
    ],
  },
  "IFSC Code Finder": {
    intro: "IFSC Code Finder 11-character code से bank और branch की उपलब्ध जानकारी दिखाता है। NEFT/RTGS/IMPS transfer से पहले code के साथ account holder और account number भी independently verify करें। Bank mergers या branch changes के कारण पुराना IFSC बदल सकता है।",
    steps: ["Cheque, passbook या bank की official जानकारी से IFSC लिखें।", "दिखे bank, branch, address और transfer facilities जाँचें।", "Payment से पहले beneficiary से code और account details दोबारा confirm करें।"],
    tips: ["IFSC सामान्यतः चार letters, zero और छह characters से बनता है।", "सिर्फ branch name देखकर money transfer न करें।", "बड़ी राशि भेजने से पहले छोटा test transfer उपयोगी हो सकता है।"],
    faqs: [
      { question: "क्या IFSC और MICR एक ही हैं?", answer: "नहीं, IFSC electronic transfers के लिए branch identifier है; MICR cheque processing में उपयोग होता है।" },
      { question: "Code न मिले तो क्या करें?", answer: "Spelling/characters जाँचें और bank की official website, passbook या branch से वर्तमान IFSC confirm करें।" },
    ],
  },
  "QR Code Generator": {
    intro: "QR Code Generator URL, text या contact information को scan होने वाले code में बदलता है। QR share करने से पहले उसे दूसरे phone से test करें, क्योंकि गलत URL या बहुत dense data बाद में print होने पर समस्या दे सकता है।",
    steps: ["सही URL या text दर्ज करें।", "QR generate करके preview देखें।", "PNG download करें और अलग device से scan test करें।"],
    tips: ["URL में https:// सहित पूरा address रखें।", "QR के चारों ओर सफेद quiet zone न काटें।", "Print में code बहुत छोटा न रखें और contrast मजबूत रखें।"],
    faqs: [
      { question: "क्या QR बाद में expire होगा?", answer: "Text/URL वाला static QR स्वयं expire नहीं होता; linked website बंद या URL बदलने पर destination काम नहीं करेगा।" },
      { question: "क्या payment QR बना सकते हैं?", answer: "साधारण text encode किया जा सकता है, लेकिन payment के लिए bank/UPI app से verified merchant QR लेना अधिक सुरक्षित है।" },
    ],
  },
  "Barcode Generator": {
    intro: "Barcode Generator text या product number से CODE 128, CODE 39, EAN-13 और UPC जैसे formats बनाता है। सही symbology data type और scanner की जरूरत पर निर्भर करती है। Retail EAN/UPC के लिए वैध registered number और check digit आवश्यक हो सकते हैं।",
    steps: ["Barcode format चुनें।", "Allowed characters/length के अनुसार value भरें।", "SVG download करके print size और scanner test करें।"],
    tips: ["CODE 128 सामान्य alphanumeric data के लिए flexible है।", "EAN-13/UPC में निर्धारित digits और check digit नियम होते हैं।", "Barcode को stretch न करें और पर्याप्त white margin रखें।"],
    faqs: [
      { question: "क्या generated barcode retail registration देता है?", answer: "नहीं, tool केवल graphic बनाता है; official retail number GS1 जैसी अधिकृत संस्था से प्राप्त होता है।" },
      { question: "SVG क्यों उपयोगी है?", answer: "SVG vector format है, इसलिए सही अनुपात रखते हुए बड़ा print करने पर lines sharp रहती हैं।" },
    ],
  },
  "URL Shortener": {
    intro: "URL Shortener लंबे link को छोटा और share करने योग्य बनाता है। Short link destination छिपा देता है, इसलिए केवल भरोसेमंद content के लिए उपयोग करें और महत्वपूर्ण campaign में original URL सुरक्षित रखें। Third-party shortener की availability पर redirect निर्भर रहता है।",
    steps: ["पूरा https:// URL paste करें।", "जरूरत हो तो उपलब्ध custom name चुनें।", "Short link खोलकर सही destination verify करने के बाद share करें।"],
    tips: ["Banking, password या private document links छोटा करने से बचें।", "Long-term print material में अपना domain बेहतर है।", "गलत destination वाला short link share होने से पहले test करें।"],
    faqs: [
      { question: "क्या short link हमेशा चलेगा?", answer: "यह shortening provider और original page दोनों की availability पर निर्भर करता है; स्थायी guarantee नहीं होती।" },
      { question: "क्या short link edit किया जा सकता है?", answer: "अधिकांश free services में बनने के बाद destination edit नहीं होता; नया link बनाना पड़ सकता है।" },
    ],
  },
  "Password Generator": {
    intro: "Password Generator random characters से मजबूत password बनाने में मदद करता है। हर account के लिए अलग password रखें और उसे भरोसेमंद password manager में save करें। Generated password को chat, email या screenshot में साझा न करें।",
    steps: ["कम से कम 14–16 characters की लंबाई चुनें।", "Uppercase, lowercase, numbers और symbols शामिल करें जहाँ site अनुमति दे।", "Password copy करके account में लगाएँ और password manager में सुरक्षित करें।"],
    tips: ["एक password कई sites पर reuse न करें।", "जहाँ उपलब्ध हो two-factor authentication चालू करें।", "Recovery codes offline सुरक्षित रखें।"],
    faqs: [
      { question: "कितनी लंबाई सुरक्षित है?", answer: "आमतौर पर 14–16 या अधिक random characters बेहतर हैं; संबंधित service की maximum length और allowed symbols देखें।" },
      { question: "क्या password यहाँ भेजना चाहिए?", answer: "नहीं, अपना वास्तविक password, OTP या recovery code किसी को भी न भेजें।" },
    ],
  },
  "Color Picker": {
    intro: "Color Picker visual selector से रंग चुनकर HEX, RGB और HSL values देता है। Website, presentation और graphic design में consistent brand color रखने के लिए code copy किया जा सकता है। Screen calibration के कारण अलग devices पर रंग थोड़ा अलग दिख सकता है।",
    steps: ["Picker से रंग चुनें या ज्ञात code दर्ज करें।", "Live preview और HEX/RGB/HSL values देखें।", "Required format copy करके design tool में test करें।"],
    tips: ["Text/background contrast accessibility के लिए जाँचें।", "Brand palette में primary, secondary और neutral colors लिखकर रखें।", "Print output RGB screen से अलग हो सकता है; professional print में CMYK proof लें।"],
    faqs: [
      { question: "HEX और RGB में अंतर क्या है?", answer: "दोनों digital color को दर्शाते हैं; HEX hexadecimal notation है और RGB red, green, blue numeric channels देता है।" },
      { question: "क्या चुना रंग print में बिल्कुल समान आएगा?", answer: "जरूरी नहीं; printer, paper, ink और color profile के कारण फर्क आ सकता है।" },
    ],
  },
};

export function ToolGuideContent({ title }: { title: string }) {
  const guide = guides[title];
  if (!guide) return null;

  return (
    <article className="mt-12 rounded-[2rem] border border-slate-200 bg-white px-6 py-8 shadow-sm sm:px-9 sm:py-10">
      <div className="max-w-4xl">
        <p className="text-sm font-extrabold uppercase tracking-[0.16em] text-[#b4552d]">उपयोगी मार्गदर्शिका</p>
        <h2 className="mt-2 text-3xl font-black tracking-tight text-[#173f35]">{title} का सही उपयोग कैसे करें</h2>
        <p className="mt-4 text-base leading-8 text-slate-600">{guide.intro}</p>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl bg-[#f5f1e8] p-6">
          <h3 className="text-xl font-black text-[#173f35]">तीन आसान चरण</h3>
          <ol className="mt-4 space-y-3 text-slate-700">
            {guide.steps.map((step, index) => (
              <li key={step} className="flex gap-3 leading-7">
                <span className="grid size-7 shrink-0 place-items-center rounded-full bg-[#173f35] text-sm font-bold text-white">{index + 1}</span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
        </section>

        <section className="rounded-2xl bg-emerald-50 p-6">
          <h3 className="text-xl font-black text-[#173f35]">बेहतर परिणाम के सुझाव</h3>
          <ul className="mt-4 space-y-3 text-slate-700">
            {guide.tips.map((tip) => <li key={tip} className="leading-7">• {tip}</li>)}
          </ul>
        </section>
      </div>

      <section className="mt-8">
        <h3 className="text-2xl font-black text-[#173f35]">अक्सर पूछे जाने वाले प्रश्न</h3>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          {guide.faqs.map((faq) => (
            <div key={faq.question} className="rounded-2xl border border-slate-200 p-5">
              <h4 className="font-extrabold text-slate-900">{faq.question}</h4>
              <p className="mt-2 leading-7 text-slate-600">{faq.answer}</p>
            </div>
          ))}
        </div>
      </section>

      <p className="mt-8 border-t border-slate-200 pt-5 text-sm leading-6 text-slate-500">
        महत्वपूर्ण file या calculation को submit करने से पहले original record और संबंधित विभाग/सेवा के नियमों से अंतिम जाँच अवश्य करें।
      </p>
    </article>
  );
}
