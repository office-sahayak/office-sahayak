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

// Kruti Dev 010 contains several alternate key sequences for the same glyph.
// They are common in older government-office documents, but cannot be derived
// by simply reversing the preferred Unicode -> Kruti Dev table above.
const legacyAliases = [
  ["ñ", "॰"],
  [")Z", "र्द्ध"],
  ["‘", '"'], ["’", '"'], ["“", "'"], ["”", "'"],
  ["¶+", "फ़्"], ["d+", "क़"], ["[+k", "ख़"], ["[+", "ख़्"],
  ["x+", "ग़"], ["T+", "ज़्"], ["t+", "ज़"], ["Q+", "फ़"],
  [";+", "य़"], ["j+", "ऱ"], ["u+", "ऩ"],
  ["é", "न्न"], ["™", "न्न्"], ["nzZ", "र्द्र"], ["Á", "प्र"],
  ["b±", "ईं"], ["Ã", "ई"],
  ["Dk", "क"], ["Xk", "ग"], ["Ä", "घ"], ["Pk", "च"],
  ["Tk", "ज"], ["Rk", "त"], ["èk", "ध"], ["Ë", "ध्"],
  ["è", "ध्"], ["Uk", "न"], ["Ik", "प"], ["Ck", "ब"],
  ["Ek", "म"], ["Yk", "ल"], ["Ok", "व"], ["Lk", "स"],
  ["È", "ीं"], ["z", "्र"],
  ["Ì", "द्द"], ["Í", "ट्ट"], ["Î", "ट्ठ"], ["Ï", "ड्ड"],
  ["Ñ", "कृ"], ["Ò", "भ"], ["Ó", "्य"], ["Ô", "ड्ढ"],
  ["Ö", "झ्"], ["Ük", "श"], ["Ü", "श्"],
  ["•", "ऽ"], ["∙", "ऽ"], ["~j", "्र"], ["+", "़"],
  [" ः", ":"], ["(", ";"], ["@", "/"],
] as const;

for (const [legacy, unicode] of legacyAliases) legacyToUnicode.set(legacy, unicode);

// Kruti Dev uses the same glyph for a rare micro sign and a normal hyphen.
// Office documents overwhelmingly intend a hyphen (for example, 2025-26).
legacyToUnicode.set("&", "-");

const legacyCorrections = [
  ["Q+Z", "QZ+"],
  ["sas", "sa"],
  ["aa", "a"],
  ["ZZ", "Z"],
  ["=kk", "=k"],
  ["f=k", "f="],
] as const;

const legacyPattern = new RegExp(
  Array.from(legacyToUnicode.keys())
    .sort((left, right) => right.length - left.length)
    .map((value) => value.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&"))
    .join("|"),
  "gu",
);
const devanagariConsonant = "[\\u0915-\\u0939\\u0958-\\u095f]";
const consonantCluster = `(?:${devanagariConsonant}\\u093c?\\u094d)*${devanagariConsonant}\\u093c?`;
const shortIAnusvaraMarkerPattern = new RegExp(`f([\\u0901\\u0902])(${consonantCluster})`, "gu");
const shortIMarkerPattern = new RegExp(`f(${consonantCluster})`, "gu");
const rephMarkerPattern = new RegExp(`(${consonantCluster}[\\u0901-\\u0903\\u093a\\u093b\\u093e-\\u094c\\u094e\\u094f]*)Z`, "gu");
const nasalBeforeMatraPattern = /([ँं])([ािीुूृॄॅेैोौ])/gu;

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

  let converted = text;
  for (const [incorrect, corrected] of legacyCorrections) {
    converted = converted.split(incorrect).join(corrected);
  }

  converted = converted.replace(legacyPattern, (legacy) => legacyToUnicode.get(legacy) ?? legacy);

  // These positional glyphs are handled after the ordinary lookup so the
  // marker letters inserted here are not mistaken for literal legacy text.
  converted = converted
    .replace(/±/gu, "Zं")
    .replace(/Æ/gu, "र्f")
    .replace(/Ç/gu, "fं")
    .replace(/É/gu, "र्fं")
    .replace(/Ê/gu, "ीZ");

  converted = converted.replace(shortIAnusvaraMarkerPattern, "$2ि$1");
  converted = converted.replace(shortIMarkerPattern, "$1ि");
  converted = converted.replace(rephMarkerPattern, "र्$1");
  converted = converted.replace(nasalBeforeMatraPattern, "$2$1");
  return converted.normalize("NFC");
}

export function containsDevanagari(text: string) {
  return devanagariMark.test(text);
}
