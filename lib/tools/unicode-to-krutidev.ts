/*
 * Unicode to Kruti Dev 010 conversion table and shaping rules.
 * Conversion data adapted from the open-source Indian Language Converter:
 * https://github.com/deepakkamboj/indianlanguageconverter
 * Copyright (c) 2026 Deepak Kamboj, used under the MIT License.
 */

const unicodeGlyphs = [
  "'", "'", '"', '"', "(", ")", "{", "}", "=", "।", "?", "-", "µ", "॰", ",", ".", "् ",
  "०", "१", "२", "३", "४", "५", "६", "७", "८", "९", "x",
  "फ़्", "क़", "ख़", "ग़", "ज़्", "ज़", "ड़", "ढ़", "फ़", "य़", "ऱ", "ऩ",
  "त्त्", "त्त", "क्त", "दृ", "कृ",
  "ह्न", "ह्य", "हृ", "ह्म", "ह्र", "ह्", "द्द", "क्ष्", "क्ष", "त्र्", "त्र", "ज्ञ",
  "छ्य", "ट्य", "ठ्य", "ड्य", "ढ्य", "द्य", "द्व",
  "श्र", "ट्र", "ड्र", "ढ्र", "छ्र", "क्र", "फ्र", "द्र", "प्र", "ग्र", "रु", "रू",
  "Z",
  "ओ", "औ", "आ", "अ", "ई", "इ", "उ", "ऊ", "ऐ", "ए", "ऋ",
  "क्", "क", "क्क", "ख्", "ख", "ग्", "ग", "घ्", "घ", "ङ",
  "चै", "च्", "च", "छ", "ज्", "ज", "झ्", "झ", "ञ",
  "ट्ट", "ट्ठ", "ट", "ठ", "ड्ड", "ड्ढ", "ड", "ढ", "ण्", "ण",
  "त्", "त", "थ्", "थ", "द्ध", "द", "ध्", "ध", "न्", "न",
  "प्", "प", "फ्", "फ", "ब्", "ब", "भ्", "भ", "म्", "म",
  "य्", "य", "र", "ल्", "ल", "ळ", "व्", "व",
  "श्", "श", "ष्", "ष", "स्", "स", "ह",
  "ऑ", "ॉ", "ो", "ौ", "ा", "ी", "ु", "ू", "ृ", "े", "ै",
  "ं", "ँ", "ः", "ॅ", "ऽ", "् ", "्",
] as const;

const krutiGlyphs = [
  "^", "*", "Þ", "ß", "¼", "½", "¿", "À", "¾", "A", "\\", "&", "&", "Œ", "]", "-", "~ ",
  "å", "ƒ", "„", "…", "†", "‡", "ˆ", "‰", "Š", "‹", "Û",
  "¶", "d", "[k", "x", "T", "t", "M+", "<+", "Q", ";", "j", "u",
  "Ù", "Ùk", "ä", "–", "—",
  "à", "á", "â", "ã", "ºz", "º", "í", "{", "{k", "«", "=", "K",
  "Nî", "Vî", "Bî", "Mî", "<î", "|", "}",
  "J", "Vª", "Mª", "<ªª", "Nª", "Ø", "Ý", "æ", "ç", "xz", "#", ":",
  "Z",
  "vks", "vkS", "vk", "v", "bZ", "b", "m", "Å", ",s", ",", "_",
  "D", "d", "ô", "[", "[k", "X", "x", "?", "?k", "³",
  "pkS", "P", "p", "N", "T", "t", "÷", ">", "¥",
  "ê", "ë", "V", "B", "ì", "ï", "M", "<", ".", ".k",
  "R", "r", "F", "Fk", ")", "n", "/", "/k", "U", "u",
  "I", "i", "¶", "Q", "C", "c", "H", "Hk", "E", "e",
  "¸", ";", "j", "Y", "y", "G", "O", "o",
  "'", "'k", '"', '"k', "L", "l", "g",
  "v‚", "‚", "ks", "kS", "k", "h", "q", "w", "`", "s", "S",
  "a", "¡", "%", "W", "·", "~ ", "~",
] as const;

const devanagariMark = /[\u0900-\u097f]/u;
const matras = new Set(["ा", "ि", "ी", "ु", "ू", "ृ", "े", "ै", "ो", "ौ", "ं", "ः", "ँ", "ॅ", "़"]);
const legacyToUnicode = new Map<string, string>();

for (let index = 0; index < krutiGlyphs.length; index += 1) {
  const legacy = krutiGlyphs[index];
  const unicode = unicodeGlyphs[index];
  if (legacy !== unicode) legacyToUnicode.set(legacy, unicode);
}

// Kruti Dev uses the same glyph for a rare micro sign and a normal hyphen.
// Office documents overwhelmingly intend a hyphen (for example, 2025-26).
legacyToUnicode.set("&", "-");

const legacyPattern = new RegExp(
  Array.from(legacyToUnicode.keys())
    .sort((left, right) => right.length - left.length)
    .map((value) => value.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&"))
    .join("|"),
  "gu",
);
const devanagariConsonant = "[\\u0915-\\u0939\\u0958-\\u095f]";
const consonantCluster = `(?:${devanagariConsonant}\\u093c?\\u094d)*${devanagariConsonant}\\u093c?`;
const shortIMarkerPattern = new RegExp(`f(${consonantCluster})`, "gu");
const rephMarkerPattern = new RegExp(`(${consonantCluster}[\\u0901-\\u0903\\u093a\\u093b\\u093e-\\u094c\\u094e\\u094f]*)Z`, "gu");

function moveShortI(text: string) {
  let value = text;
  let position = value.indexOf("ि");

  while (position >= 0) {
    let clusterStart = position - 1;
    while (clusterStart >= 2 && value[clusterStart - 1] === "्") clusterStart -= 2;
    const cluster = value.slice(clusterStart, position);
    value = `${value.slice(0, clusterStart)}f${cluster}${value.slice(position + 1)}`;
    position = value.indexOf("ि", clusterStart + cluster.length + 1);
  }

  return value;
}

function moveReph(text: string) {
  let value = text;
  let position = value.indexOf("र्");

  while (position >= 0) {
    const clusterStart = position + 2;
    if (clusterStart >= value.length) break;

    let cursor = clusterStart + 1;
    while (cursor < value.length) {
      const character = value[cursor];
      if (character === "्" && cursor + 1 < value.length) {
        cursor += 2;
        continue;
      }
      if (matras.has(character)) {
        cursor += 1;
        continue;
      }
      break;
    }

    const cluster = value.slice(clusterStart, cursor);
    value = `${value.slice(0, position)}${cluster}Z${value.slice(cursor)}`;
    position = value.indexOf("र्", position + cluster.length + 1);
  }

  return value;
}

export function unicodeToKrutiDev(text: string) {
  if (!text) return "";

  let converted = moveReph(moveShortI(text.normalize("NFC")));

  for (let index = 0; index < unicodeGlyphs.length; index += 1) {
    const unicode = unicodeGlyphs[index];
    const kruti = krutiGlyphs[index];
    if (unicode !== kruti) converted = converted.split(unicode).join(kruti);
  }

  return converted;
}

export function krutiDevToUnicode(text: string) {
  if (!text) return "";

  let converted = text.replace(legacyPattern, (legacy) => legacyToUnicode.get(legacy) ?? legacy);
  converted = converted.replace(shortIMarkerPattern, "$1ि");
  converted = converted.replace(rephMarkerPattern, "र्$1");
  return converted.normalize("NFC");
}

export function containsDevanagari(text: string) {
  return devanagariMark.test(text);
}
