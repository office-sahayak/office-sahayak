export interface ArticleSection {
  heading: string;
  paragraphs: string[];
  bullets?: string[];
}

export interface KnowledgeArticle {
  slug: string;
  title: string;
  description: string;
  category: string;
  readTime: string;
  publishedAt: string;
  updatedAt: string;
  intro: string;
  sections: ArticleSection[];
  checklist: string[];
  faqs: Array<{ question: string; answer: string }>;
  relatedTool: { href: string; label: string };
}

export const articles: KnowledgeArticle[] = [
  {
    slug: "word-to-pdf-table-layout-guide",
    title: "Word से PDF बनाते समय table और layout सही कैसे रखें",
    description: "DOCX को PDF में बदलने से पहले fonts, tables, margins, page breaks और final output जाँचने की व्यावहारिक हिन्दी guide।",
    category: "Document conversion",
    readTime: "8 मिनट",
    publishedAt: "2026-09-30",
    updatedAt: "2026-10-08",
    intro: "Word document screen पर ठीक दिख सकता है, फिर भी PDF में table टूटना, heading अगली page पर जाना या Hindi font बदलना आम समस्या है। इसका कारण अक्सर converter नहीं, बल्कि document में save हुई page settings, unavailable font या fixed row height होती है। नीचे दिए क्रम से जाँच करने पर conversion अधिक भरोसेमंद बनती है।",
    sections: [
      {
        heading: "Conversion से पहले document तैयार करें",
        paragraphs: [
          "Microsoft Word या LibreOffice Writer में file खोलकर page size A4, orientation और margins जाँचें। Section breaks वाले document में हर section की setting अलग हो सकती है, इसलिए केवल पहले page की setting देखकर निर्णय न लें। अंतिम paragraph marks दिखाकर खाली pages और अनावश्यक page breaks भी हटाएँ।",
          "Document में उपयोग हुए fonts उसी computer या conversion server पर उपलब्ध होने चाहिए। Kruti Dev, DevLys या किसी विशेष सरकारी font के गायब होने पर substitute font लग सकता है, जिससे line wrapping और table width बदल जाती है।",
        ],
        bullets: ["File की original copy अलग रखें।", "Track Changes और comments final करने के बाद PDF बनाएँ।", "Header, footer और page numbering सभी sections में जाँचें।"],
      },
      {
        heading: "Table को page के भीतर स्थिर रखें",
        paragraphs: [
          "Table Properties में preferred width को page की printable width से अधिक न रखें। बहुत चौड़ी table को landscape section, छोटे margins या उचित column width की जरूरत हो सकती है। केवल font बहुत छोटा करके table फिट करना readability घटाता है।",
          "Rows के लिए exact height तभी रखें जब content हमेशा एक line का हो। लंबे Hindi text के लिए minimum height या automatic height बेहतर है। Row को अगली page पर टूटने से रोकना जरूरी हो तो ‘Allow row to break across pages’ setting बंद करें, लेकिन बहुत लंबी row के लिए इससे खाली जगह बन सकती है।",
        ],
      },
      {
        heading: "Hindi fonts और alignment की जाँच",
        paragraphs: [
          "Unicode Hindi और legacy fonts अलग encoding इस्तेमाल करते हैं। केवल font dropdown में Kruti Dev चुनने से Unicode text सही Kruti Dev text नहीं बनता। Legacy document को उसी font के साथ खोलें और conversion के बाद संयुक्त अक्षर, मात्रा, अंक तथा punctuation को मूल file से मिलाएँ।",
          "Center alignment, paragraph spacing और line spacing style में set करना अधिक स्थिर रहता है। कई बार manually लगाए गए spaces screen पर alignment देते हैं, पर PDF में font metrics बदलते ही text खिसक जाता है।",
        ],
      },
      {
        heading: "बड़े document में page breaks सँभालें",
        paragraphs: [
          "Heading को अगले paragraph के साथ रखने के लिए Keep with next उपयोग करें। एक साथ बहुत सारे paragraphs पर यह विकल्प लगाने से Word पूरा block अगली page पर भेज सकता है। Manual page break केवल वहीं रखें जहाँ नया chapter या निश्चित section शुरू होना चाहिए।",
          "Images के लिए ‘In line with text’ सबसे predictable विकल्प है। Floating images, text boxes और grouped shapes अलग Office engines में थोड़ा खिसक सकते हैं, इसलिए जरूरी form या seal वाले page का PDF preview विशेष रूप से जाँचें।",
        ],
      },
      {
        heading: "Final PDF की व्यवस्थित जाँच",
        paragraphs: [
          "PDF बनने के बाद पहला page देखकर download पूरा न मानें। Total page count, table के आखिरी rows, header/footer, signatures और अंतिम annexure खोलें। 100% zoom के साथ 200% zoom पर भी छोटे text और borders देखें।",
          "यदि layout बदला है तो बार-बार उसी PDF को edit करने के बजाय source DOCX सुधारें और नई PDF बनाएँ। इससे searchable text, accessibility और future correction सुरक्षित रहते हैं।",
        ],
      },
    ],
    checklist: ["A4 size, orientation और margins सही हैं", "सभी आवश्यक fonts उपलब्ध हैं", "Table page width के भीतर है", "अंतिम और table वाले सभी pages देखे हैं", "नाम, तारीख, राशि और हस्ताक्षर मूल से मिलाए हैं"],
    faqs: [
      { question: "Table की border PDF में क्यों गायब होती है?", answer: "बहुत हल्की theme border, zero-width style या cell shading के कारण border अस्पष्ट हो सकती है। Source DOCX में स्पष्ट solid border लगाकर फिर conversion करें।" },
      { question: "Center text PDF में खिसक जाए तो क्या करें?", answer: "Spaces हटाकर paragraph alignment को Center करें और सही font उपलब्ध रखें। Text box के बजाय सामान्य paragraph या table cell उपयोग करना अधिक स्थिर है।" },
      { question: "क्या password-protected DOCX convert होगा?", answer: "Password या editing restriction वाली file पहले अधिकृत password से खोलकर सामान्य copy save करनी पड़ सकती है। बिना अनुमति protection हटाने का प्रयास न करें।" },
    ],
    relatedTool: { href: "/tools/documents/word-to-pdf", label: "Word से PDF टूल खोलें" },
  },
  {
    slug: "excel-to-pdf-a4-print-guide",
    title: "Excel sheet को साफ़ A4 PDF में बदलने की पूरी तैयारी",
    description: "Excel print area, scaling, repeat headings, borders और extra blank pages ठीक करके A4 PDF बनाने की हिन्दी guide।",
    category: "Spreadsheet",
    readTime: "9 मिनट",
    publishedAt: "2026-09-30",
    updatedAt: "2026-10-08",
    intro: "Excel से PDF बनाते समय सबसे ज्यादा समस्याएँ print settings से आती हैं। कोई दूर का खाली-looking cell, गलत print area या अत्यधिक scaling पूरी report को छोटा कर सकती है। Workbook को पहले print-ready बनाना converter बदलने से अधिक उपयोगी होता है।",
    sections: [
      {
        heading: "असल data range पहचानें",
        paragraphs: [
          "Ctrl+End दबाने पर Excel जिस cell पर ले जाता है, वह sheet का saved used range बताता है। यदि data J column तक है लेकिन cursor बहुत दूर XFD या हजारों rows पर जाता है, तो formatting या whitespace बचा हो सकता है। अनावश्यक rows/columns साफ़ करके file save, close और reopen करें।",
          "ऐसा cell जो खाली दिखता है उसमें formula, space, border या formatting हो सकती है। उसे केवल Backspace से नहीं, जरूरत के अनुसार Clear All से साफ़ करें। वास्तविक data हटाने से पहले backup अवश्य रखें।",
        ],
      },
      {
        heading: "Print area और page orientation सेट करें",
        paragraphs: [
          "केवल आवश्यक cells चुनकर Print Area निर्धारित करें। Wide register के लिए landscape और सामान्य पत्रक के लिए portrait चुनें। Paper Size A4 रखें और Page Break Preview में नीली boundaries देखकर pages का विभाजन समझें।",
          "Fit All Columns on One Page चौड़ी sheet में उपयोगी है, पर बहुत अधिक columns हों तो text अपठनीय हो सकता है। ऐसी स्थिति में columns को समूहों में बाँटना या landscape के साथ दो pages स्वीकार करना बेहतर है।",
        ],
      },
      {
        heading: "हर page पर heading दोहराएँ",
        paragraphs: [
          "लंबी सूची में Page Layout के Print Titles विकल्प से header rows repeat करें। इससे दूसरे page पर भी column names दिखाई देते हैं और printed report समझना आसान होता है। Merged heading और actual column heading अलग rows में हों तो दोनों rows शामिल करें।",
          "Top margin में report title दोहराने के बजाय header/footer का उपयोग कर सकते हैं। Confidential report में file path या personal username अपने आप न छपे, इसके लिए footer fields जाँचें।",
        ],
      },
      {
        heading: "Borders, row height और Hindi text",
        paragraphs: [
          "Gridlines और cell borders अलग होते हैं। Official table के लिए आवश्यक cells पर explicit borders लगाएँ, क्योंकि default gridlines PDF में न भी आएँ। Wrapped Hindi text के लिए AutoFit Row Height उपयोग करें और merged cells में text कट रहा हो तो row height manually बढ़ाएँ।",
          "Legacy Hindi font वाली sheet के लिए वही font conversion environment में उपलब्ध होना चाहिए। Formulas के result, dates और leading zeros वाली registration numbers को PDF से पहले जाँचें।",
        ],
      },
      {
        heading: "PDF preview और अंतिम verification",
        paragraphs: [
          "Print Preview में total pages देखें। अचानक बहुत अधिक pages दिखें तो stray cells, manual page breaks या print area की जाँच करें। पहला, बीच का और अंतिम page zoom करके देखें; totals और signatures अक्सर अंतिम page पर कटते हैं।",
          "Multiple worksheets वाली workbook में तय करें कि active sheet चाहिए या पूरी workbook। Hidden sheets में confidential data हो तो whole-workbook export करने से पहले सावधानी रखें।",
        ],
      },
    ],
    checklist: ["Used range केवल वास्तविक data तक है", "Print area और A4 orientation सेट है", "Repeat heading rows चुनी गई हैं", "Borders और wrapped text preview में स्पष्ट हैं", "Page count और अंतिम totals जाँचे हैं"],
    faqs: [
      { question: "PDF में extra blank page क्यों आती है?", answer: "अक्सर दूर मौजूद formatted cell, manual page break या print area में शामिल खाली column कारण होता है। Used range और Page Break Preview जाँचें।" },
      { question: "एक page में fit करने पर text बहुत छोटा क्यों है?", answer: "Excel सभी columns को A4 width में scale करता है। अनावश्यक columns हटाएँ, landscape चुनें या report को दो pages में बाँटें।" },
      { question: "क्या formulas PDF में बदल जाते हैं?", answer: "PDF में formula का दिख रहा result आता है। Conversion से पहले workbook calculate और save करें ताकि पुराना cached result न रहे।" },
    ],
    relatedTool: { href: "/tools/documents/excel-to-pdf", label: "Excel से PDF टूल खोलें" },
  },
  {
    slug: "hindi-ocr-accuracy-guide",
    title: "Hindi OCR की accuracy बढ़ाने के practical तरीके",
    description: "PDF या document photo से editable Hindi Word बनाते समय scan quality, proofreading, tables और अंकों की accuracy सुधारने की guide।",
    category: "Hindi OCR",
    readTime: "8 मिनट",
    publishedAt: "2026-09-30",
    updatedAt: "2026-10-08",
    intro: "OCR किसी image के pixels से अक्षर पहचानता है; वह document का अर्थ समझने वाला typist नहीं है। साफ़ scan पर भी ‘ि’, ‘ी’, संयुक्त अक्षर, 0/6 और 1/7 जैसी आकृतियाँ गलत पढ़ी जा सकती हैं। बेहतर source और व्यवस्थित proofreading से error काफी कम किए जा सकते हैं।",
    sections: [
      {
        heading: "साफ़ और सीधा source बनाएं",
        paragraphs: [
          "Document को समतल रखें, camera को page के ठीक ऊपर रखें और चारों कोने frame में लें। एक तरफ से रोशनी पड़ने पर shadow और चमक बनती है; diffuse daylight या दोनों तरफ समान light बेहतर रहती है।",
          "Photo crop करते समय text न काटें। बहुत बड़ा background हटाएँ और page को perspective correction से सीधा करें। Blur photo पर sharpening सीमित मदद करती है; संभव हो तो photo दोबारा लें।",
        ],
      },
      {
        heading: "Resolution और contrast का संतुलन",
        paragraphs: [
          "छोटे printed Hindi text के लिए स्पष्ट high-resolution image उपयोगी है, लेकिन केवल file size बढ़ाना quality नहीं बढ़ाता। WhatsApp से बार-बार भेजी image compress हो सकती है। Original camera file या scanner output बेहतर है।",
          "Background हल्का और text गहरा होना चाहिए। अत्यधिक threshold मुहर, मात्रा या पतली border मिटा सकता है। Color document में seal या handwritten correction जरूरी हो तो grayscale बनाने से पहले original copy रखें।",
        ],
      },
      {
        heading: "Tables को cell-by-cell जाँचें",
        paragraphs: [
          "OCR table की lines और text दोनों पहचानता है। टूटी borders या merged cells होने पर columns गलत जुड़ सकते हैं। Preview में पहले table structure, फिर प्रत्येक row के नाम, code और amount जाँचें।",
          "Serial number, registration number, date और phone जैसी values में केवल spelling नहीं, digit count भी मिलाएँ। Leading zero अक्सर छूट जाता है और date separator बदल सकता है।",
        ],
      },
      {
        heading: "Proofreading का भरोसेमंद क्रम",
        paragraphs: [
          "पहले headings और paragraph order देखें, फिर names और technical terms, उसके बाद dates, amounts और codes। एक साथ formatting और spelling सुधारने पर critical number छूट सकता है। मूल scan को side-by-side रखकर line-by-line मिलाना सबसे विश्वसनीय तरीका है।",
          "Search का उपयोग करके बार-बार आने वाली OCR गलती खोजें, लेकिन Replace All सावधानी से करें। समान दिखने वाला अक्षर किसी दूसरे सही शब्द में भी हो सकता है।",
        ],
      },
      {
        heading: "Editable Word बनने के बाद",
        paragraphs: [
          "Word में paragraph order, table widths और page breaks जाँचें। Kruti Dev या DevLys output के लिए संबंधित font install होना चाहिए। File किसी ऐसे व्यक्ति को भेजें जिसके computer में font न हो तो PDF reference साथ देना उपयोगी है।",
          "Official submission से पहले printed या PDF preview देखें। OCR output draft है; कानूनी, वित्तीय या सरकारी record के रूप में उपयोग से पहले जिम्मेदार व्यक्ति से सत्यापन जरूरी है।",
        ],
      },
    ],
    checklist: ["Image सीधी, sharp और पूरी है", "नाम और संयुक्त अक्षर मूल से मिलाए हैं", "सभी dates, amounts और codes दोबारा जाँचे हैं", "Table rows और columns सही हैं", "Word और PDF preview दोनों देखे हैं"],
    faqs: [
      { question: "Handwriting OCR से सही आएगी?", answer: "साफ़ handwriting कुछ हद तक पहचानी जा सकती है, पर printed text की तुलना में error अधिक रहती है। Manual verification जरूरी है।" },
      { question: "कौन-सा image format बेहतर है?", answer: "साफ़ PNG या high-quality JPG दोनों ठीक हैं। Format से अधिक focus, resolution, contrast और सीधा page महत्वपूर्ण है।" },
      { question: "OCR में numbers गलत क्यों आते हैं?", answer: "कम resolution, stamp, table line या समान आकृति वाले digits कारण हो सकते हैं। Numbers को source से character-by-character मिलाएँ।" },
    ],
    relatedTool: { href: "/tools/documents/hindi-krutidev-word", label: "Hindi OCR से Word टूल खोलें" },
  },
  {
    slug: "krutidev-unicode-difference-guide",
    title: "Kruti Dev, DevLys और Unicode Hindi में अंतर",
    description: "Legacy Hindi fonts और Unicode text का अंतर, सही font installation, copy-paste और conversion की सामान्य समस्याएँ समझें।",
    category: "Hindi typing",
    readTime: "7 मिनट",
    publishedAt: "2026-09-30",
    updatedAt: "2026-10-08",
    intro: "Hindi text दिखने में समान हो सकता है, लेकिन उसके पीछे stored characters अलग हो सकते हैं। Unicode आधुनिक standard है, जबकि Kruti Dev और DevLys जैसे legacy fonts Latin key codes को Hindi glyph की तरह दिखाते हैं। इसी कारण केवल font बदलना वास्तविक encoding conversion नहीं होता।",
    sections: [
      { heading: "Unicode text क्या है", paragraphs: ["Unicode में हिन्दी अक्षरों के अपने standard character codes होते हैं। इसलिए text web search, mobile, email और अधिकांश modern software में बिना विशेष font के पढ़ा जा सकता है। Copy-paste और screen reader support भी सामान्यतः बेहतर रहता है।", "Mangal, Noto Sans Devanagari और कई आधुनिक fonts Unicode text दिखाते हैं। Font बदलने पर style बदलता है, अक्षरों का अर्थ नहीं।"] },
      { heading: "Kruti Dev और DevLys कैसे काम करते हैं", paragraphs: ["Legacy font में keyboard के Latin codes पर Hindi glyph बनाए गए हैं। वही stored text font हटने पर अंग्रेज़ी जैसे बेतरतीब characters दिखा सकता है। अलग legacy font की key mapping अलग होने से Kruti Dev text को DevLys font लगाने पर भी गलत output आ सकता है।", "पुराने कार्यालयीन records और typing workflows में ये fonts अब भी उपयोग होते हैं। ऐसे document भेजते समय exact font name और version बताना उपयोगी है।"] },
      { heading: "सिर्फ font बदलना क्यों पर्याप्त नहीं", paragraphs: ["Unicode शब्द को select करके Kruti Dev font चुनने पर encoding Unicode ही रहती है। इसी तरह legacy text को Unicode font लगाने से readable Hindi नहीं बनती। सही conversion के लिए character mapping और मात्रा reordering की जरूरत होती है।", "Automatic conversion के बाद rare symbols, half letters और punctuation जाँचें। Mixed document में कुछ text Unicode और कुछ legacy हो सकता है, इसलिए पूरे file पर blind conversion न चलाएँ।"] },
      { heading: "Word file दूसरे computer पर सही कैसे खुले", paragraphs: ["Receiver के computer में वही legacy font install होना चाहिए। File के साथ font license की शर्तों का पालन करें; अनधिकृत font distribute न करें। जरूरत हो तो reference PDF भी भेजें ताकि expected appearance पता रहे।", "Microsoft Word में font substitution warning और document properties जाँचें। Final print से पहले एक test page निकालना लंबे document की गलती जल्दी पकड़ सकता है।"] },
      { heading: "किस काम में कौन-सा format चुनें", paragraphs: ["Website, searchable archive, email और long-term storage के लिए Unicode बेहतर रहता है। यदि department का prescribed template Kruti Dev या DevLys मांगता है तो उसी mapping में editable copy दें और verified PDF सुरक्षित रखें।", "Future correction के लिए source encoding का नाम file name या note में लिखें। केवल ‘Hindi font’ लिखने से अगला user सही mapping पहचान नहीं पाता।"] },
    ],
    checklist: ["Text की encoding पहचानी है", "Exact legacy font installed है", "Automatic conversion के बाद संयुक्त अक्षर जाँचे हैं", "Receiver को font requirement बताई है", "Reference PDF सुरक्षित रखी है"],
    faqs: [
      { question: "Kruti Dev file mobile पर गलत क्यों दिखती है?", answer: "Mobile में Kruti Dev font सामान्यतः installed नहीं होता और legacy codes raw characters की तरह दिखते हैं। Unicode या PDF copy उपयोग करें।" },
      { question: "क्या Kruti Dev और DevLys एक ही हैं?", answer: "दोनों legacy font families हैं, लेकिन उनकी mapping और glyph design अलग हो सकते हैं। एक का text दूसरे font में सही दिखना जरूरी नहीं।" },
      { question: "Searchable PDF के लिए क्या बेहतर है?", answer: "सही Unicode text सबसे portable है। Legacy-font PDF visually सही हो सकती है, पर search/copy behavior converter और embedded font पर निर्भर रहेगा।" },
    ],
    relatedTool: { href: "/tools/documents/hindi-krutidev-word", label: "Editable Hindi Word टूल खोलें" },
  },
  {
    slug: "pdf-merge-split-compress-safety-guide",
    title: "PDF merge, split और compress करने से पहले क्या जाँचें",
    description: "PDF pages जोड़ने, निकालने और size घटाने में order, signatures, privacy और readability सुरक्षित रखने की guide।",
    category: "PDF management",
    readTime: "7 मिनट",
    publishedAt: "2026-09-30",
    updatedAt: "2026-10-08",
    intro: "PDF tools सरल दिखते हैं, पर गलत page order, unreadable compression या digital signature टूटने से submission reject हो सकता है। Original file सुरक्षित रखकर और output को व्यवस्थित तरीके से जाँचकर इन जोखिमों को कम किया जा सकता है।",
    sections: [
      { heading: "Original files और सही क्रम", paragraphs: ["काम शुरू करने से पहले original PDFs की copy अलग folder में रखें। Files को 01-application, 02-id, 03-annexure जैसे नाम देने से merge order स्पष्ट रहता है।", "Merge के बाद bookmarks हमेशा अपने आप नहीं बनते। Page 1 से अंतिम page तक thumbnails देखकर document order जाँचें।"] },
      { heading: "Split में सही page चुनें", paragraphs: ["PDF viewer का page number और printed page number अलग हो सकता है, खासकर cover या annexure वाले document में। Split range चुनते समय thumbnail content देखकर पुष्टि करें।", "केवल जरूरी pages साझा करने से privacy बेहतर रहती है। फिर भी निकाली PDF में header, QR, account number या दूसरे personal details बचे हैं या नहीं देखें।"] },
      { heading: "Compression और readability", paragraphs: ["पहले moderate compression चुनें। Small text, seal, handwritten note और QR code वाला page 200% zoom पर देखें। Portal limit पूरी करने के लिए कई बार scan resolution कम करना बेहतर है, केवल repeated compression नहीं।", "Original digital PDF को image में बदलकर compress करने से searchable text और accessibility घट सकती है। Text-based PDF के लिए मूल structure बनाए रखने वाला method चुनें।"] },
      { heading: "Digital signatures और forms", paragraphs: ["Signed PDF को merge, split या edit करने पर existing signature invalid या modified दिख सकती है। Signed original अलग रखें और संबंधित portal की requirement पढ़ें।", "Fillable form flatten हो सकता है और fields editable नहीं रहेंगी। Submission से पहले values, checkbox और signature appearance final output में जाँचें।"] },
      { heading: "Privacy और sharing", paragraphs: ["Browser-based processing में file device पर रह सकती है, फिर भी shared computer के Downloads और recent files साफ़ करना जरूरी है। Server-based service हो तो उसकी privacy policy पढ़ें और संवेदनशील pages केवल जरूरत पर उपयोग करें।", "Final PDF का नाम स्पष्ट रखें, फिर उसे दोबारा खोलकर page count और size देखें। गलत पुरानी copy attach होने से बचने के लिए draft files अलग folder में रखें।"] },
    ],
    checklist: ["Original PDFs सुरक्षित हैं", "Merge order thumbnails से जाँचा है", "Split page content से verify किया है", "Compression के बाद seal/text readable है", "Digital signature और form behavior समझा है"],
    faqs: [
      { question: "Merge से PDF quality घटती है?", answer: "सामान्य structural merge में quality नहीं घटनी चाहिए। यदि service pages को images में बदलती है तो quality बदल सकती है; output zoom करके देखें।" },
      { question: "कितना compression सुरक्षित है?", answer: "एक fixed प्रतिशत नहीं है। Document की smallest writing, seal और QR readable रहने तक ही compression स्वीकार करें।" },
      { question: "Signed PDF को split कर सकते हैं?", answer: "तकनीकी रूप से हो सकता है, लेकिन original signature validation प्रभावित हो सकती है। Official requirement के अनुसार signed original रखें।" },
    ],
    relatedTool: { href: "/tools/documents/pdf-merge", label: "PDF tools देखें" },
  },
  {
    slug: "government-portal-document-upload-checklist",
    title: "सरकारी portal पर document upload करने की checklist",
    description: "File format, size, नाम, page order और acknowledgement जाँचकर सरकारी portal submission की गलतियाँ कम करें।",
    category: "Office workflow",
    readTime: "8 मिनट",
    publishedAt: "2026-09-30",
    updatedAt: "2026-10-08",
    intro: "Portal पर upload fail होने का कारण हमेशा internet नहीं होता। गलत extension, अधिक size, अस्पष्ट scan, filename या expired session भी समस्या बन सकते हैं। Submission से पहले एक छोटी checklist रखने से दोबारा entry और गलत attachment का जोखिम घटता है।",
    sections: [
      { heading: "Portal की requirement पहले पढ़ें", paragraphs: ["Allowed format, maximum size, page limit और colour requirement note करें। ‘PDF only’ लिखा हो तो JPG का नाम बदलकर .pdf करना conversion नहीं है; सही PDF बनाएँ।", "कुछ portals हर attachment के लिए अलग category मांगते हैं। Application, ID, order और annexure को एक file में merge करने से पहले portal instructions देखें।"] },
      { heading: "Filename सरल रखें", paragraphs: ["English letters, numbers, hyphen और underscore वाला छोटा filename अधिक compatible रहता है, जैसे society-order-2025.pdf। बहुत लंबा नाम, multiple dots या special symbols कुछ portals पर error दे सकते हैं।", "Final और old files अलग रखें। Upload से ठीक पहले file खोलकर content और date देखें ताकि समान नाम वाली गलत copy न चुने।"] },
      { heading: "Scan और PDF की जाँच", paragraphs: ["Page सीधा, पूरा और readable होना चाहिए। Seal, signature और corner में लिखे reference number crop न हों। Colour जरूरी न हो तो grayscale size घटा सकता है, लेकिन colored marking महत्वपूर्ण हो तो original colour रखें।", "Merged document में pages का क्रम, orientation और blank pages जाँचें। प्रत्येक attachment का page count और file size लिख लेना बड़ी entry में मदद करता है।"] },
      { heading: "Upload के दौरान सुरक्षित तरीका", paragraphs: ["Stable network और updated browser उपयोग करें। बहुत देर तक form खुला रखने से session expire हो सकता है; पहले files तैयार रखें, फिर login करके entry करें।", "Upload progress पूरा होने और filename/status दिखने तक Save न दबाएँ। Double-click से duplicate request बन सकती है, इसलिए button response का इंतजार करें।"] },
      { heading: "Submission के बाद proof रखें", paragraphs: ["Final submit से पहले preview या summary page पढ़ें। Submission number, acknowledgement PDF और confirmation screenshot सुरक्षित रखें। केवल success toast पर निर्भर न रहें।", "यदि correction window है तो deadline note करें। Uploaded document और acknowledgement को एक folder में रखकर नाम में date शामिल करें।"] },
    ],
    checklist: ["Allowed format और size पढ़ा है", "Filename सरल और स्पष्ट है", "हर page readable और सही orientation में है", "Final preview में सही attachment दिखी है", "Acknowledgement और submission number सुरक्षित किए हैं"],
    faqs: [
      { question: "Extension बदलने से JPG, PDF बन जाता है?", answer: "नहीं। Extension rename करने से file का internal format नहीं बदलता; image-to-PDF conversion करना जरूरी है।" },
      { question: "Upload 100% पर रुक जाए तो क्या करें?", answer: "पहले कुछ समय प्रतीक्षा करें, फिर session/network देखें। बार-बार submit न दबाएँ; status clear न हो तो acknowledgement या application history जाँचें।" },
      { question: "क्या screenshot submission proof है?", answer: "यह सहायक record है, लेकिन official acknowledgement या application number अधिक महत्वपूर्ण है। उपलब्ध हो तो दोनों सुरक्षित रखें।" },
    ],
    relatedTool: { href: "/#tools", label: "Document tools देखें" },
  },
  {
    slug: "document-photo-scan-quality-guide",
    title: "मोबाइल से साफ़ document scan कैसे बनाएं",
    description: "रोशनी, camera angle, crop, resolution और multi-page order सही रखकर readable document scan बनाने की guide।",
    category: "Scanning",
    readTime: "6 मिनट",
    publishedAt: "2026-09-30",
    updatedAt: "2026-10-08",
    intro: "अच्छा scan महंगे scanner से ही बने, यह जरूरी नहीं। स्थिर camera, समान रोशनी, सीधा page और सही crop अधिक महत्वपूर्ण हैं। Mobile से ली गई साफ़ image OCR, PDF और portal upload—तीनों के परिणाम बेहतर करती है।",
    sections: [
      { heading: "Page और camera तैयार करें", paragraphs: ["Document को सपाट, contrast वाले plain background पर रखें। Fold या curve हो तो हल्के weight से किनारे समतल करें, पर text न ढकें। Camera lens साफ़ करें और phone को page के समानांतर रखें।", "Digital zoom से बचें; camera को पर्याप्त पास लाएँ ताकि page frame भर दे और चारों corners दिखाई दें।"] },
      { heading: "रोशनी में shadow और glare हटाएँ", paragraphs: ["Window की नरम रोशनी उपयोगी है, पर direct sunlight कठोर shadow बनाती है। Lamination या glossy paper पर flash glare देता है; flash बंद करके light का angle बदलें।", "अपना हाथ या phone page पर shadow न डाले। दोनों तरफ समान light मिलने से background uniform रहता है।"] },
      { heading: "Focus और resolution", paragraphs: ["Text वाले हिस्से पर tap करके focus lock करें और capture से पहले phone स्थिर रखें। Blur दिखे तो उसी समय photo दोबारा लें; बाद की sharpening खोए अक्षर वापस नहीं लाती।", "Original image रखें। Messaging apps से भेजी compressed copy की जगह direct file transfer या original-quality option उपयोग करें।"] },
      { heading: "Crop, rotate और filter", paragraphs: ["Crop में page edge रखें, लेकिन मुहर, हस्ताक्षर या margin note न काटें। Perspective correction से trapezoid page सीधा करें। हर page की orientation समान रखें।", "Black-and-white filter छोटे marks मिटा सकता है। Filter के बाद और original दोनों देखकर निर्णय लें, खासकर coloured seal और faint carbon copy में।"] },
      { heading: "Multi-page PDF बनाते समय", paragraphs: ["Pages को capture के तुरंत बाद सही क्रम दें और missing page जाँचें। Front/back document में दोनों sides शामिल हों। Final PDF का page count, size और प्रत्येक page की readability देखें।", "Official upload से पहले filename स्पष्ट रखें और original photos अलग सुरक्षित करें, ताकि किसी page की quality खराब मिले तो केवल वही page दोबारा बनाया जा सके।"] },
    ],
    checklist: ["चारों corners और पूरा text दिख रहा है", "Glare, shadow और blur नहीं है", "Page सीधा और सही orientation में है", "Seal/signature crop नहीं हुई", "Multi-page order और count सही है"],
    faqs: [
      { question: "Flash कब उपयोग करें?", answer: "Matte paper और बहुत कम light में flash मदद कर सकता है, लेकिन glare दिखे तो flash बंद करके दूसरी light उपयोग करें।" },
      { question: "Black-and-white filter हमेशा बेहतर है?", answer: "नहीं। Faint text, coloured seal या handwritten note filter में खो सकता है। Original देखकर तुलना करें।" },
      { question: "Photo या PDF—क्या upload करें?", answer: "Portal जो format मांगे वही दें। Multiple pages के लिए सही क्रम वाली PDF अधिक सुविधाजनक हो सकती है।" },
    ],
    relatedTool: { href: "/tools/documents/hindi-krutidev-word", label: "Document OCR टूल खोलें" },
  },
  {
    slug: "online-document-privacy-safety-guide",
    title: "Online document tools इस्तेमाल करते समय privacy कैसे बचाएँ",
    description: "संवेदनशील files, browser processing, downloads और shared computer के लिए सरल privacy और security practices।",
    category: "Privacy",
    readTime: "7 मिनट",
    publishedAt: "2026-09-30",
    updatedAt: "2026-10-08",
    intro: "Document tool सुविधाजनक है, लेकिन हर file समान संवेदनशील नहीं होती। सार्वजनिक notice और bank statement को एक ही तरह handle नहीं करना चाहिए। Minimum data, trusted connection और local cleanup जैसे छोटे कदम privacy risk घटाते हैं।",
    sections: [
      { heading: "File की sensitivity पहचानें", paragraphs: ["Aadhaar, PAN, bank details, medical record, salary statement, signature और internal office record संवेदनशील माने जाने चाहिए। पूरा document जरूरी न हो तो केवल संबंधित page या masked copy उपयोग करें।", "किसी और व्यक्ति का document process करने से पहले आपकी भूमिका और अनुमति स्पष्ट होनी चाहिए। सुविधा के लिए अनावश्यक personal data upload न करें।"] },
      { heading: "Browser और server processing का अंतर", paragraphs: ["कुछ tools JavaScript से browser में file process करते हैं; कुछ conversions के लिए temporary server processing आवश्यक होती है। Tool page और privacy policy में processing description पढ़ें।", "Browser-based होने पर भी downloaded output device पर रहता है। Shared computer या synced Downloads folder में नई privacy risk बन सकती है।"] },
      { heading: "Safe device और network", paragraphs: ["Updated browser, trusted device और secure connection उपयोग करें। Public computer, unknown Wi-Fi या remote-control session में confidential file से बचें।", "Password, OTP, PIN या recovery code document tool में न डालें। Password-protected file खोलनी हो तो official application में अधिकृत password इस्तेमाल करें।"] },
      { heading: "Download और sharing hygiene", paragraphs: ["Output खोलकर verify करने के बाद उसे सही folder में move करें और temporary copies हटाएँ। Browser download history हटाना file delete करने के बराबर नहीं है; actual Downloads folder भी देखें।", "Email या messaging से भेजने से पहले recipient और attachment दोबारा जाँचें। Link sharing में access permissions और expiry उपलब्ध हो तो उनका उपयोग करें।"] },
      { heading: "Incident होने पर", paragraphs: ["गलत recipient को file भेजी हो तो तुरंत delete request, access revoke और संबंधित अधिकारी को सूचना दें। Bank या identity data शामिल हो तो संबंधित institution की official guidance follow करें।", "Suspicious site पर upload का संदेह हो तो password बदलना तभी उपयोगी है जब document में credentials थे; identity documents के लिए अलग protective steps जरूरी हो सकते हैं। घटना का समय और shared file record रखें।"] },
    ],
    checklist: ["केवल आवश्यक data उपयोग किया है", "Tool की processing/privacy जानकारी पढ़ी है", "Trusted device और connection उपयोग किए हैं", "Output सही recipient को भेजा है", "Temporary/download copies संभाली हैं"],
    faqs: [
      { question: "Browser-based tool पूरी तरह risk-free है?", answer: "नहीं। Server upload कम हो सकता है, लेकिन device security, browser extensions, downloads और sharing से risk बना रहता है।" },
      { question: "Sensitive page को कैसे कम करें?", answer: "जरूरी page split करें या अनावश्यक field की authorized masked copy बनाएँ। Original evidence को बिना नियम समझे edit न करें।" },
      { question: "Shared computer पर क्या साफ़ करें?", answer: "Downloaded files, temporary export, recycle bin और browser session देखें; account से sign out करके browser बंद करें।" },
    ],
    relatedTool: { href: "/privacy", label: "Office Sahayak की गोपनीयता नीति पढ़ें" },
  },
  {
    slug: "financial-calculators-verification-guide",
    title: "EMI, GST और percentage calculator के परिणाम कैसे जाँचें",
    description: "Online financial calculators के inputs, rounding, fees और official records समझकर result verify करने की हिन्दी guide।",
    category: "Calculators",
    readTime: "7 मिनट",
    publishedAt: "2026-09-30",
    updatedAt: "2026-10-08",
    intro: "Calculator तेजी से अनुमान देता है, पर input की परिभाषा गलत हो तो mathematically सही result भी आपके काम के लिए गलत हो सकता है। Interest rate annual है या monthly, GST inclusive है या exclusive, और percentage किस base पर है—इन बातों को पहले स्पष्ट करें।",
    sections: [
      { heading: "EMI में सही inputs", paragraphs: ["Loan amount में down payment घटाकर वास्तविक principal डालें। Annual interest rate और tenure months/years सही unit में दें। Floating rate वाले loan में future EMI या tenure बदल सकती है।", "Processing fee, insurance, late charge और tax सामान्य EMI formula में शामिल नहीं होते। Bank की sanction letter और amortization schedule final authority होते हैं।"] },
      { heading: "Interest और rounding समझें", paragraphs: ["EMI formula monthly reducing balance मान सकता है। Flat-rate quotation से इसकी तुलना सीधे न करें। प्रत्येक installment में rounding के कारण अंतिम payment थोड़ा अलग हो सकता है।", "किसी offer की तुलना करते समय केवल EMI नहीं, total repayment, fees और tenure साथ देखें। कम EMI लंबी अवधि के कारण अधिक total interest दे सकती है।"] },
      { heading: "GST calculation", paragraphs: ["Exclusive price में GST जोड़ना और inclusive total से tax निकालना अलग calculation है। सही rate item/service classification पर निर्भर करता है; calculator classification तय नहीं करता।", "Invoice में taxable value, CGST/SGST या IGST और rounding अलग lines में हो सकती हैं। Filing या accounting से पहले लागू official rule और invoice data verify करें।"] },
      { heading: "Percentage और age", paragraphs: ["Percentage change में old value base होती है, जबकि ‘कुल का प्रतिशत’ में total base होता है। दोनों formulas का अर्थ अलग है। Negative या zero base पर interpretation सावधानी से करें।", "Age calculator date difference बताता है, लेकिन eligibility में cutoff date और विभागीय नियम लागू होते हैं। Form में वही date format भरें जो portal मांगता है।"] },
      { heading: "Result को independently verify करें", paragraphs: ["Input values को एक बार फिर पढ़ें, units लिखें और जरूरत पर दूसरे method या official statement से मिलाएँ। Screenshot में inputs भी रखें ताकि बाद में result का आधार समझ आए।", "महत्वपूर्ण loan, tax या eligibility निर्णय केवल online calculator पर न लें। Bank, accountant या संबंधित authority के official document को प्राथमिकता दें।"] },
    ],
    checklist: ["Amount, rate और tenure units सही हैं", "Fees/insurance अलग समझे हैं", "GST inclusive/exclusive सही चुना है", "Percentage का base स्पष्ट है", "Official document से final verification किया है"],
    faqs: [
      { question: "Calculator और bank EMI में फर्क क्यों है?", answer: "Rounding, disbursement date, rate method, insurance, fees या first installment period अलग हो सकते हैं। Bank schedule देखें।" },
      { question: "GST rate calculator बताएगा?", answer: "Calculator दिए गए rate पर गणना करता है; सही classification और rate official source या qualified professional से verify करें।" },
      { question: "Age result eligibility तय करता है?", answer: "नहीं। Eligibility में notification की cutoff date, relaxation और अन्य नियम लागू होते हैं।" },
    ],
    relatedTool: { href: "/#tools", label: "Office calculators देखें" },
  },
];

export function getArticle(slug: string) {
  return articles.find((article) => article.slug === slug);
}
