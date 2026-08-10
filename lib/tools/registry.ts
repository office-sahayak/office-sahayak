/**
 * Central tool registry for OfficeSahayak.
 * All Hindi text uses JavaScript Unicode escapes to ensure ASCII-only source.
 *
 * To add a new tool:
 * 1. Add an entry here with a unique slug and appropriate category.
 * 2. Implement the tool page at app/tools/[category]/[slug]/page.tsx.
 */

import type { Tool } from "./types";

export const tools: Tool[] = [
  // DOCUMENTS
  {
    slug: "pdf-merge",
    // PDF \u092e\u0930\u094d\u091c = PDF Merge
    name: "PDF \u092e\u0930\u094d\u091c",
    // \u0915\u0908 PDF \u092b\u093e\u0907\u0932\u094b\u0902 \u0915\u094b \u090f\u0915 \u092e\u0947\u0902 \u091c\u094b\u0921\u093c\u0947\u0902 = Kai PDF files ko ek mein joden
    description: "\u0915\u0908 PDF \u092b\u093e\u0907\u0932\u094b\u0902 \u0915\u094b \u090f\u0915 \u092e\u0947\u0902 \u091c\u094b\u0921\u093c\u0947\u0902",
    category: "documents",
    icon: "\u{1F4CE}",
    status: "available",
    // \u092e\u0930\u094d\u091c, \u091c\u094b\u0921\u093c\u0947\u0902, \u0915\u0902\u092c\u093e\u0907\u0928 = merge, joden, combine
    keywords: ["\u092e\u0930\u094d\u091c", "\u091c\u094b\u0921\u093c\u0947\u0902", "\u0915\u0902\u092c\u093e\u0907\u0928"],
  },
  {
    slug: "pdf-split",
    // PDF \u0938\u094d\u092a\u094d\u0932\u093f\u091f = PDF Split
    name: "PDF \u0938\u094d\u092a\u094d\u0932\u093f\u091f",
    // PDF \u0915\u094b \u0905\u0932\u0917-\u0905\u0932\u0917 \u092a\u0947\u091c\u094b\u0902 \u092e\u0947\u0902 \u092c\u093e\u0901\u091f\u0947\u0902 = PDF ko alag-alag pages mein banten
    description: "PDF \u0915\u094b \u0905\u0932\u0917-\u0905\u0932\u0917 \u092a\u0947\u091c\u094b\u0902 \u092e\u0947\u0902 \u092c\u093e\u0901\u091f\u0947\u0902",
    category: "documents",
    icon: "\u2702\uFE0F",
    status: "available",
    // \u0938\u094d\u092a\u094d\u0932\u093f\u091f, \u092c\u093e\u0901\u091f\u0947\u0902, \u0905\u0932\u0917 = split, banten, alag
    keywords: ["\u0938\u094d\u092a\u094d\u0932\u093f\u091f", "\u092c\u093e\u0901\u091f\u0947\u0902", "\u0905\u0932\u0917"],
  },
  {
    slug: "pdf-compress",
    // PDF \u0915\u0902\u092a\u094d\u0930\u0947\u0938 = PDF Compress
    name: "PDF \u0915\u0902\u092a\u094d\u0930\u0947\u0938",
    // PDF \u0915\u093e \u0938\u093e\u0907\u091c \u091b\u094b\u091f\u093e \u0915\u0930\u0947\u0902 = PDF ka size chhota karen
    description: "PDF \u0915\u093e \u0938\u093e\u0907\u091c \u091b\u094b\u091f\u093e \u0915\u0930\u0947\u0902",
    category: "documents",
    icon: "\u{1F5DC}",
    status: "coming-soon",
    // \u0915\u0902\u092a\u094d\u0930\u0947\u0938, \u091b\u094b\u091f\u093e, \u0938\u093e\u0907\u091c = compress, chhota, size
    keywords: ["\u0915\u0902\u092a\u094d\u0930\u0947\u0938", "\u091b\u094b\u091f\u093e", "\u0938\u093e\u0907\u091c"],
  },
  {
    slug: "word-to-pdf",
    // Word \u0938\u0947 PDF = Word se PDF
    name: "Word \u0938\u0947 PDF",
    // Word \u0921\u0949\u0915\u094d\u092f\u0942\u092e\u0947\u0902\u091f \u0915\u094b PDF \u092e\u0947\u0902 \u092c\u0926\u0932\u0947\u0902 = Word document ko PDF mein badlen
    description: "Word \u0921\u0949\u0915\u094d\u092f\u0942\u092e\u0947\u0902\u091f \u0915\u094b PDF \u092e\u0947\u0902 \u092c\u0926\u0932\u0947\u0902",
    category: "documents",
    icon: "\u{1F4C4}",
    status: "coming-soon",
    // \u0915\u0928\u094d\u0935\u0930\u094d\u091f, \u092c\u0926\u0932\u0947\u0902, docx = convert, badlen, docx
    keywords: ["\u0915\u0928\u094d\u0935\u0930\u094d\u091f", "\u092c\u0926\u0932\u0947\u0902", "docx"],
  },
  {
    slug: "excel-to-pdf",
    // Excel \u0938\u0947 PDF = Excel se PDF
    name: "Excel \u0938\u0947 PDF",
    // Excel \u0936\u0940\u091f \u0915\u094b PDF \u092e\u0947\u0902 \u092c\u0926\u0932\u0947\u0902 = Excel sheet ko PDF mein badlen
    description: "Excel \u0936\u0940\u091f \u0915\u094b PDF \u092e\u0947\u0902 \u092c\u0926\u0932\u0947\u0902",
    category: "documents",
    icon: "\u{1F4CA}",
    status: "coming-soon",
    // \u0915\u0928\u094d\u0935\u0930\u094d\u091f, \u092c\u0926\u0932\u0947\u0902, xlsx = convert, badlen, xlsx
    keywords: ["\u0915\u0928\u094d\u0935\u0930\u094d\u091f", "\u092c\u0926\u0932\u0947\u0902", "xlsx"],
  },
  {
    slug: "hindi-krutidev-word",
    // Hindi OCR \u0938\u0947 Kruti Dev = Hindi OCR se Kruti Dev
    name: "Hindi OCR \u0938\u0947 Kruti Dev",
    // PDF/JPEG \u0938\u0947 Kruti Dev Word \u092c\u0928\u093e\u090f\u0901 = PDF/JPEG se Kruti Dev Word banayen
    description: "PDF/JPEG \u0938\u0947 Kruti Dev Word \u092c\u0928\u093e\u090f\u0901",
    category: "documents",
    icon: "\u0915\u0943",
    status: "available",
    keywords: ["Hindi OCR", "Kruti Dev", "\u0915\u0943\u0924\u093f\u0926\u0947\u0935", "JPEG", "Word"],
  },

  // TEXT
  {
    slug: "case-converter",
    // \u0915\u0947\u0938 \u0915\u0928\u094d\u0935\u0930\u094d\u091f\u0930 = Case Converter
    name: "\u0915\u0947\u0938 \u0915\u0928\u094d\u0935\u0930\u094d\u091f\u0930",
    // \u091f\u0947\u0915\u094d\u0938\u094d\u091f \u0915\u094b uppercase, lowercase \u092e\u0947\u0902 \u092c\u0926\u0932\u0947\u0902 = Text ko uppercase, lowercase mein badlen
    description: "\u091f\u0947\u0915\u094d\u0938\u094d\u091f \u0915\u094b uppercase, lowercase \u092e\u0947\u0902 \u092c\u0926\u0932\u0947\u0902",
    category: "text",
    icon: "\u{1F520}",
    status: "coming-soon",
    // uppercase, lowercase, \u0915\u0948\u092a\u093f\u091f\u0932 = uppercase, lowercase, capital
    keywords: ["uppercase", "lowercase", "\u0915\u0948\u092a\u093f\u091f\u0932"],
  },
  {
    slug: "word-counter",
    // \u0936\u092c\u094d\u0926 \u0917\u093f\u0928\u0924\u0940 = Shabd Ginti (Word Counter)
    name: "\u0936\u092c\u094d\u0926 \u0917\u093f\u0928\u0924\u0940",
    // \u091f\u0947\u0915\u094d\u0938\u094d\u091f \u092e\u0947\u0902 \u0936\u092c\u094d\u0926 \u0914\u0930 \u0905\u0915\u094d\u0937\u0930 \u0917\u093f\u0928\u0947\u0902 = Text mein shabd aur akshar ginen
    description: "\u091f\u0947\u0915\u094d\u0938\u094d\u091f \u092e\u0947\u0902 \u0936\u092c\u094d\u0926 \u0914\u0930 \u0905\u0915\u094d\u0937\u0930 \u0917\u093f\u0928\u0947\u0902",
    category: "text",
    icon: "\u{1F522}",
    status: "coming-soon",
    // \u0917\u093f\u0928\u0924\u0940, \u0915\u093e\u0909\u0902\u091f, \u0936\u092c\u094d\u0926 = ginti, count, shabd
    keywords: ["\u0917\u093f\u0928\u0924\u0940", "\u0915\u093e\u0909\u0902\u091f", "\u0936\u092c\u094d\u0926"],
  },
  {
    slug: "text-diff",
    // \u091f\u0947\u0915\u094d\u0938\u094d\u091f \u0924\u0941\u0932\u0928\u093e = Text Tulna (Text Diff)
    name: "\u091f\u0947\u0915\u094d\u0938\u094d\u091f \u0924\u0941\u0932\u0928\u093e",
    // \u0926\u094b \u091f\u0947\u0915\u094d\u0938\u094d\u091f \u092e\u0947\u0902 \u0905\u0902\u0924\u0930 \u0926\u0947\u0916\u0947\u0902 = Do text mein antar dekhen
    description: "\u0926\u094b \u091f\u0947\u0915\u094d\u0938\u094d\u091f \u092e\u0947\u0902 \u0905\u0902\u0924\u0930 \u0926\u0947\u0916\u0947\u0902",
    category: "text",
    icon: "\u{1F50D}",
    status: "coming-soon",
    // \u0924\u0941\u0932\u0928\u093e, \u0905\u0902\u0924\u0930, \u0921\u093f\u092b = tulna, antar, diff
    keywords: ["\u0924\u0941\u0932\u0928\u093e", "\u0905\u0902\u0924\u0930", "\u0921\u093f\u092b"],
  },

  // IMAGE
  {
    slug: "image-compress",
    // \u091b\u0935\u093f \u0915\u0902\u092a\u094d\u0930\u0947\u0938 = Chhavi Compress (Image Compress)
    name: "\u091b\u0935\u093f \u0915\u0902\u092a\u094d\u0930\u0947\u0938",
    // \u092b\u094b\u091f\u094b \u0915\u093e \u0938\u093e\u0907\u091c \u091b\u094b\u091f\u093e \u0915\u0930\u0947\u0902 = Photo ka size chhota karen
    description: "\u092b\u094b\u091f\u094b \u0915\u093e \u0938\u093e\u0907\u091c \u091b\u094b\u091f\u093e \u0915\u0930\u0947\u0902",
    category: "image",
    icon: "\u{1F5DC}",
    status: "coming-soon",
    // \u0915\u0902\u092a\u094d\u0930\u0947\u0938, \u091b\u094b\u091f\u093e, \u092b\u094b\u091f\u094b = compress, chhota, photo
    keywords: ["\u0915\u0902\u092a\u094d\u0930\u0947\u0938", "\u091b\u094b\u091f\u093e", "\u092b\u094b\u091f\u094b"],
  },
  {
    slug: "image-resize",
    // \u091b\u0935\u093f \u0930\u093f\u0938\u093e\u0907\u091c = Chhavi Resize (Image Resize)
    name: "\u091b\u0935\u093f \u0930\u093f\u0938\u093e\u0907\u091c",
    // \u092b\u094b\u091f\u094b \u0915\u0940 \u0906\u0915\u093e\u0930 \u092c\u0926\u0932\u0947\u0902 = Photo ki aakar badlen
    description: "\u092b\u094b\u091f\u094b \u0915\u0940 \u0906\u0915\u093e\u0930 \u092c\u0926\u0932\u0947\u0902",
    category: "image",
    icon: "\u{1F4CF}",
    status: "coming-soon",
    // \u0930\u093f\u0938\u093e\u0907\u091c, \u0906\u0915\u093e\u0930, \u092c\u0926\u0932\u0947\u0902 = resize, aakar, badlen
    keywords: ["\u0930\u093f\u0938\u093e\u0907\u091c", "\u0906\u0915\u093e\u0930", "\u092c\u0926\u0932\u0947\u0902"],
  },
  {
    slug: "image-crop",
    // \u091b\u0935\u093f \u0915\u094d\u0930\u0949\u092a = Chhavi Crop (Image Crop)
    name: "\u091b\u0935\u093f \u0915\u094d\u0930\u0949\u092a",
    // \u092b\u094b\u091f\u094b \u0915\u094b \u0915\u093e\u091f\u0947\u0902 = Photo ko katen
    description: "\u092b\u094b\u091f\u094b \u0915\u094b \u0915\u093e\u091f\u0947\u0902",
    category: "image",
    icon: "\u2702\uFE0F",
    status: "coming-soon",
    // \u0915\u094d\u0930\u0949\u092a, \u0915\u093e\u091f\u0947\u0902, \u091f\u094d\u0930\u093f\u092e = crop, katen, trim
    keywords: ["\u0915\u094d\u0930\u0949\u092a", "\u0915\u093e\u091f\u0947\u0902", "\u091f\u094d\u0930\u093f\u092e"],
  },
  {
    slug: "image-format-converter",
    // \u091b\u0935\u093f \u092b\u0949\u0930\u094d\u092e\u0947\u091f \u0915\u0928\u094d\u0935\u0930\u094d\u091f\u0930 = Chhavi Format Converter
    name: "\u091b\u0935\u093f \u092b\u0949\u0930\u094d\u092e\u0947\u091f \u0915\u0928\u094d\u0935\u0930\u094d\u091f\u0930",
    // JPG, PNG, WebP \u092e\u0947\u0902 \u092c\u0926\u0932\u0947\u0902 = JPG, PNG, WebP mein badlen
    description: "JPG, PNG, WebP \u092e\u0947\u0902 \u092c\u0926\u0932\u0947\u0902",
    category: "image",
    icon: "\u{1F5BC}",
    status: "coming-soon",
    // \u0915\u0928\u094d\u0935\u0930\u094d\u091f, \u092b\u0949\u0930\u094d\u092e\u0947\u091f, \u092c\u0926\u0932\u0947\u0902 = convert, format, badlen
    keywords: ["\u0915\u0928\u094d\u0935\u0930\u094d\u091f", "\u092b\u0949\u0930\u094d\u092e\u0947\u091f", "\u092c\u0926\u0932\u0947\u0902"],
  },

  // CALCULATORS
  {
    slug: "emi-calculator",
    // EMI \u0915\u0948\u0932\u094d\u0915\u0941\u0932\u0947\u091f\u0930 = EMI Calculator
    name: "EMI \u0915\u0948\u0932\u094d\u0915\u0941\u0932\u0947\u091f\u0930",
    // \u0932\u094b\u0928 \u0915\u0940 EMI \u0915\u0948\u0932\u094d\u0915\u0941\u0932\u0947\u091f \u0915\u0930\u0947\u0902 = Loan ki EMI calculate karen
    description: "\u0932\u094b\u0928 \u0915\u0940 EMI \u0915\u0948\u0932\u094d\u0915\u0941\u0932\u0947\u091f \u0915\u0930\u0947\u0902",
    category: "calculators",
    icon: "\u{1F4B0}",
    status: "coming-soon",
    // EMI, \u0932\u094b\u0928, \u0915\u093f\u0938\u094d\u0924 = EMI, loan, kist
    keywords: ["EMI", "\u0932\u094b\u0928", "\u0915\u093f\u0938\u094d\u0924"],
  },
  {
    slug: "gst-calculator",
    // GST \u0915\u0948\u0932\u094d\u0915\u0941\u0932\u0947\u091f\u0930 = GST Calculator
    name: "GST \u0915\u0948\u0932\u094d\u0915\u0941\u0932\u0947\u091f\u0930",
    // GST \u0915\u0948\u0932\u094d\u0915\u0941\u0932\u0947\u091f \u0915\u0930\u0947\u0902 = GST calculate karen
    description: "GST \u0915\u0948\u0932\u094d\u0915\u0941\u0932\u0947\u091f \u0915\u0930\u0947\u0902",
    category: "calculators",
    icon: "\u{1F9FE}",
    status: "coming-soon",
    // GST, \u091f\u0948\u0915\u094d\u0938, \u0915\u0930 = GST, tax, kar
    keywords: ["GST", "\u091f\u0948\u0915\u094d\u0938", "\u0915\u0930"],
  },
  {
    slug: "percentage-calculator",
    // \u092a\u094d\u0930\u0924\u093f\u0936\u0924 \u0915\u0948\u0932\u094d\u0915\u0941\u0932\u0947\u091f\u0930 = Pratishat Calculator (Percentage Calculator)
    name: "\u092a\u094d\u0930\u0924\u093f\u0936\u0924 \u0915\u0948\u0932\u094d\u0915\u0941\u0932\u0947\u091f\u0930",
    // \u092a\u094d\u0930\u0924\u093f\u0936\u0924 \u0915\u0948\u0932\u094d\u0915\u0941\u0932\u0947\u091f \u0915\u0930\u0947\u0902 = Pratishat calculate karen
    description: "\u092a\u094d\u0930\u0924\u093f\u0936\u0924 \u0915\u0948\u0932\u094d\u0915\u0941\u0932\u0947\u091f \u0915\u0930\u0947\u0902",
    category: "calculators",
    icon: "\u0025",
    status: "coming-soon",
    // \u092a\u094d\u0930\u0924\u093f\u0936\u0924, \u092b\u0940\u0938\u0926\u0940, \u092a\u0930\u0938\u0947\u0902\u091f = pratishat, feesadi, percent
    keywords: ["\u092a\u094d\u0930\u0924\u093f\u0936\u0924", "\u092b\u0940\u0938\u0926\u0940", "\u092a\u0930\u0938\u0947\u0902\u091f"],
  },
  {
    slug: "age-calculator",
    // \u0909\u092e\u094d\u0930 \u0915\u0948\u0932\u094d\u0915\u0941\u0932\u0947\u091f\u0930 = Umr Calculator (Age Calculator)
    name: "\u0909\u092e\u094d\u0930 \u0915\u0948\u0932\u094d\u0915\u0941\u0932\u0947\u091f\u0930",
    // \u0905\u092a\u0928\u0940 \u0909\u092e\u094d\u0930 \u0915\u0948\u0932\u094d\u0915\u0941\u0932\u0947\u091f \u0915\u0930\u0947\u0902 = Apni umr calculate karen
    description: "\u0905\u092a\u0928\u0940 \u0909\u092e\u094d\u0930 \u0915\u0948\u0932\u094d\u0915\u0941\u0932\u0947\u091f \u0915\u0930\u0947\u0902",
    category: "calculators",
    icon: "\u{1F382}",
    status: "coming-soon",
    // \u0909\u092e\u094d\u0930, \u0906\u092f\u0941, \u091c\u0928\u094d\u092e = umr, aayu, janm
    keywords: ["\u0909\u092e\u094d\u0930", "\u0906\u092f\u0941", "\u091c\u0928\u094d\u092e"],
  },

  // GOVERNMENT
  {
    slug: "pan-card-validator",
    // PAN \u0915\u093e\u0930\u094d\u0921 \u0935\u0948\u0932\u093f\u0921\u0947\u091f\u0930 = PAN Card Validator
    name: "PAN \u0915\u093e\u0930\u094d\u0921 \u0935\u0948\u0932\u093f\u0921\u0947\u091f\u0930",
    // PAN \u0928\u0902\u092c\u0930 \u0935\u0948\u0932\u093f\u0921 \u0939\u0948 \u092f\u093e \u0928\u0939\u0940\u0902 \u091a\u0947\u0915 \u0915\u0930\u0947\u0902 = PAN number valid hai ya nahin check karen
    description: "PAN \u0928\u0902\u092c\u0930 \u0935\u0948\u0932\u093f\u0921 \u0939\u0948 \u092f\u093e \u0928\u0939\u0940\u0902 \u091a\u0947\u0915 \u0915\u0930\u0947\u0902",
    category: "government",
    icon: "\u{1F4B3}",
    status: "coming-soon",
    // PAN, \u0935\u0948\u0932\u093f\u0921\u0947\u091f, \u091a\u0947\u0915 = PAN, validate, check
    keywords: ["PAN", "\u0935\u0948\u0932\u093f\u0921\u0947\u091f", "\u091a\u0947\u0915"],
  },
  {
    slug: "aadhaar-validator",
    // \u0906\u0927\u093e\u0930 \u0935\u0948\u0932\u093f\u0921\u0947\u091f\u0930 = Aadhaar Validator
    name: "\u0906\u0927\u093e\u0930 \u0935\u0948\u0932\u093f\u0921\u0947\u091f\u0930",
    // \u0906\u0927\u093e\u0930 \u0928\u0902\u092c\u0930 \u0935\u0948\u0932\u093f\u0921 \u0939\u0948 \u092f\u093e \u0928\u0939\u0940\u0902 \u091a\u0947\u0915 \u0915\u0930\u0947\u0902 = Aadhaar number valid hai ya nahin check karen
    description: "\u0906\u0927\u093e\u0930 \u0928\u0902\u092c\u0930 \u0935\u0948\u0932\u093f\u0921 \u0939\u0948 \u092f\u093e \u0928\u0939\u0940\u0902 \u091a\u0947\u0915 \u0915\u0930\u0947\u0902",
    category: "government",
    icon: "\u{1F4C7}",
    status: "coming-soon",
    // \u0906\u0927\u093e\u0930, \u0935\u0948\u0932\u093f\u0921\u0947\u091f, \u091a\u0947\u0915 = Aadhaar, validate, check
    keywords: ["\u0906\u0927\u093e\u0930", "\u0935\u0948\u0932\u093f\u0921\u0947\u091f", "\u091a\u0947\u0915"],
  },
  {
    slug: "ifsc-code-finder",
    // IFSC \u0915\u094b\u0921 \u092b\u093e\u0907\u0902\u0921\u0930 = IFSC Code Finder
    name: "IFSC \u0915\u094b\u0921 \u092b\u093e\u0907\u0902\u0921\u0930",
    // \u092c\u0948\u0902\u0915 \u0915\u093e IFSC \u0915\u094b\u0921 \u0916\u094b\u091c\u0947\u0902 = Bank ka IFSC code khojen
    description: "\u092c\u0948\u0902\u0915 \u0915\u093e IFSC \u0915\u094b\u0921 \u0916\u094b\u091c\u0947\u0902",
    category: "government",
    icon: "\u{1F3E6}",
    status: "coming-soon",
    // IFSC, \u092c\u0948\u0902\u0915, \u0915\u094b\u0921 = IFSC, bank, code
    keywords: ["IFSC", "\u092c\u0948\u0902\u0915", "\u0915\u094b\u0921"],
  },

  // UTILITIES
  {
    slug: "qr-code-generator",
    // QR \u0915\u094b\u0921 \u091c\u0928\u0930\u0947\u091f\u0930 = QR Code Generator
    name: "QR \u0915\u094b\u0921 \u091c\u0928\u0930\u0947\u091f\u0930",
    // \u091f\u0947\u0915\u094d\u0938\u094d\u091f \u092f\u093e URL \u0938\u0947 QR \u0915\u094b\u0921 \u092c\u0928\u093e\u090f\u0902 = Text ya URL se QR code banaaen
    description: "\u091f\u0947\u0915\u094d\u0938\u094d\u091f \u092f\u093e URL \u0938\u0947 QR \u0915\u094b\u0921 \u092c\u0928\u093e\u090f\u0902",
    category: "utilities",
    icon: "\u{1F4F1}",
    status: "coming-soon",
    // QR, \u0915\u094b\u0921, \u091c\u0928\u0930\u0947\u091f = QR, code, generate
    keywords: ["QR", "\u0915\u094b\u0921", "\u091c\u0928\u0930\u0947\u091f"],
  },
  {
    slug: "barcode-generator",
    // \u092c\u093e\u0930\u0915\u094b\u0921 \u091c\u0928\u0930\u0947\u091f\u0930 = Barcode Generator
    name: "\u092c\u093e\u0930\u0915\u094b\u0921 \u091c\u0928\u0930\u0947\u091f\u0930",
    // \u092c\u093e\u0930\u0915\u094b\u0921 \u092c\u0928\u093e\u090f\u0902 = Barcode banaaen
    description: "\u092c\u093e\u0930\u0915\u094b\u0921 \u092c\u0928\u093e\u090f\u0902",
    category: "utilities",
    icon: "\u{1F3F7}",
    status: "coming-soon",
    // \u092c\u093e\u0930\u0915\u094b\u0921, \u0915\u094b\u0921, \u091c\u0928\u0930\u0947\u091f = barcode, code, generate
    keywords: ["\u092c\u093e\u0930\u0915\u094b\u0921", "\u0915\u094b\u0921", "\u091c\u0928\u0930\u0947\u091f"],
  },
  {
    slug: "url-shortener",
    // URL \u0936\u0949\u0930\u094d\u091f\u0928\u0930 = URL Shortener
    name: "URL \u0936\u0949\u0930\u094d\u091f\u0928\u0930",
    // \u0932\u0902\u092c\u0947 URL \u0915\u094b \u091b\u094b\u091f\u093e \u092c\u0928\u093e\u090f\u0902 = Lambe URL ko chhota banaaen
    description: "\u0932\u0902\u092c\u0947 URL \u0915\u094b \u091b\u094b\u091f\u093e \u092c\u0928\u093e\u090f\u0902",
    category: "utilities",
    icon: "\u{1F517}",
    status: "coming-soon",
    // URL, \u0936\u0949\u0930\u094d\u091f, \u0932\u093f\u0902\u0915 = URL, short, link
    keywords: ["URL", "\u0936\u0949\u0930\u094d\u091f", "\u0932\u093f\u0902\u0915"],
  },
  {
    slug: "password-generator",
    // \u092a\u093e\u0938\u0935\u0930\u094d\u0921 \u091c\u0928\u0930\u0947\u091f\u0930 = Password Generator
    name: "\u092a\u093e\u0938\u0935\u0930\u094d\u0921 \u091c\u0928\u0930\u0947\u091f\u0930",
    // \u092e\u091c\u092c\u0942\u0924 \u092a\u093e\u0938\u0935\u0930\u094d\u0921 \u092c\u0928\u093e\u090f\u0902 = Majboot password banaaen
    description: "\u092e\u091c\u092c\u0942\u0924 \u092a\u093e\u0938\u0935\u0930\u094d\u0921 \u092c\u0928\u093e\u090f\u0902",
    category: "utilities",
    icon: "\u{1F511}",
    status: "coming-soon",
    // \u092a\u093e\u0938\u0935\u0930\u094d\u0921, \u092e\u091c\u092c\u0942\u0924, \u091c\u0928\u0930\u0947\u091f = password, majboot, generate
    keywords: ["\u092a\u093e\u0938\u0935\u0930\u094d\u0921", "\u092e\u091c\u092c\u0942\u0924", "\u091c\u0928\u0930\u0947\u091f"],
  },
  {
    slug: "color-picker",
    // \u0915\u0932\u0930 \u092a\u093f\u0915\u0930 = Color Picker
    name: "\u0915\u0932\u0930 \u092a\u093f\u0915\u0930",
    // \u0930\u0902\u0917 \u091a\u0941\u0928\u0947\u0902 \u0914\u0930 \u0915\u094b\u0921 \u092a\u093e\u090f\u0902 = Rang chunen aur code paaen
    description: "\u0930\u0902\u0917 \u091a\u0941\u0928\u0947\u0902 \u0914\u0930 \u0915\u094b\u0921 \u092a\u093e\u090f\u0902",
    category: "utilities",
    icon: "\u{1F3A8}",
    status: "coming-soon",
    // \u0915\u0932\u0930, \u0930\u0902\u0917, hex = color, rang, hex
    keywords: ["\u0915\u0932\u0930", "\u0930\u0902\u0917", "hex"],
  },
];
