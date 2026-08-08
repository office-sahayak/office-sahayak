/**
 * Site-wide configuration for OfficeSahayak.
 * All Hindi text uses JavaScript Unicode escapes to ensure ASCII-only source.
 */

export const siteConfig = {
  name: "OfficeSahayak",
  // \u0915\u093e\u0930\u094d\u092f\u093e\u0932\u092f \u0938\u0939\u093e\u092f\u0915 = Karyalaya Sahayak
  tagline: "\u0915\u093e\u0930\u094d\u092f\u093e\u0932\u092f \u0938\u0939\u093e\u092f\u0915",
  // \u0906\u092a\u0915\u0947 \u0915\u093e\u092e \u0915\u0947 \u0932\u093f\u090f \u092e\u0941\u092b\u094d\u0924 \u0911\u0928\u0932\u093e\u0907\u0928 \u091f\u0942\u0932\u094d\u0938 = Aapke kaam ke liye muft online tools
  description: "\u0906\u092a\u0915\u0947 \u0915\u093e\u092e \u0915\u0947 \u0932\u093f\u090f \u092e\u0941\u092b\u094d\u0924 \u0911\u0928\u0932\u093e\u0907\u0928 \u091f\u0942\u0932\u094d\u0938",
  url: "https://officesahayak.com",
  links: {
    github: "https://github.com/yourusername/office-sahayak",
  },
} as const;
