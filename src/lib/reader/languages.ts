export interface Language {
  code: string;
  bcp47: string;
  name: string;
  nativeName: string;
  rtl?: boolean;
}

const RAW_LANGUAGES: Language[] = [
  { code: "af", bcp47: "af-ZA", name: "Afrikaans", nativeName: "Afrikaans" },
  { code: "sq", bcp47: "sq-AL", name: "Albanian", nativeName: "Shqip" },
  { code: "am", bcp47: "am-ET", name: "Amharic", nativeName: "አማርኛ" },
  { code: "ar", bcp47: "ar-SA", name: "Arabic", nativeName: "العربية", rtl: true },
  { code: "hy", bcp47: "hy-AM", name: "Armenian", nativeName: "Հայերեն" },
  { code: "as", bcp47: "as-IN", name: "Assamese", nativeName: "অসমীয়া" },
  { code: "az", bcp47: "az-AZ", name: "Azerbaijani", nativeName: "Azərbaycan" },
  { code: "eu", bcp47: "eu-ES", name: "Basque", nativeName: "Euskara" },
  { code: "be", bcp47: "be-BY", name: "Belarusian", nativeName: "Беларуская" },
  { code: "bn", bcp47: "bn-IN", name: "Bengali", nativeName: "বাংলা" },
  { code: "bs", bcp47: "bs-BA", name: "Bosnian", nativeName: "Bosanski" },
  { code: "bg", bcp47: "bg-BG", name: "Bulgarian", nativeName: "Български" },
  { code: "my", bcp47: "my-MM", name: "Burmese", nativeName: "မြန်မာဘာသာ" },
  { code: "ca", bcp47: "ca-ES", name: "Catalan", nativeName: "Català" },
  { code: "zh", bcp47: "zh-CN", name: "Chinese (Simplified)", nativeName: "简体中文" },
  { code: "zh-TW", bcp47: "zh-TW", name: "Chinese (Traditional)", nativeName: "繁體中文" },
  { code: "hr", bcp47: "hr-HR", name: "Croatian", nativeName: "Hrvatski" },
  { code: "cs", bcp47: "cs-CZ", name: "Czech", nativeName: "Čeština" },
  { code: "da", bcp47: "da-DK", name: "Danish", nativeName: "Dansk" },
  { code: "nl", bcp47: "nl-NL", name: "Dutch", nativeName: "Nederlands" },
  { code: "en", bcp47: "en-US", name: "English", nativeName: "English" },
  { code: "et", bcp47: "et-EE", name: "Estonian", nativeName: "Eesti" },
  { code: "fil", bcp47: "fil-PH", name: "Filipino", nativeName: "Filipino" },
  { code: "fi", bcp47: "fi-FI", name: "Finnish", nativeName: "Suomi" },
  { code: "fr", bcp47: "fr-FR", name: "French", nativeName: "Français" },
  { code: "gl", bcp47: "gl-ES", name: "Galician", nativeName: "Galego" },
  { code: "ka", bcp47: "ka-GE", name: "Georgian", nativeName: "ქართული" },
  { code: "de", bcp47: "de-DE", name: "German", nativeName: "Deutsch" },
  { code: "el", bcp47: "el-GR", name: "Greek", nativeName: "Ελληνικά" },
  { code: "gu", bcp47: "gu-IN", name: "Gujarati", nativeName: "ગુજરાતી" },
  { code: "ht", bcp47: "ht-HT", name: "Haitian Creole", nativeName: "Kreyòl Ayisyen" },
  { code: "ha", bcp47: "ha-NG", name: "Hausa", nativeName: "Hausa" },
  { code: "he", bcp47: "he-IL", name: "Hebrew", nativeName: "עברית", rtl: true },
  { code: "hi", bcp47: "hi-IN", name: "Hindi", nativeName: "हिन्दी" },
  { code: "hu", bcp47: "hu-HU", name: "Hungarian", nativeName: "Magyar" },
  { code: "is", bcp47: "is-IS", name: "Icelandic", nativeName: "Íslenska" },
  { code: "ig", bcp47: "ig-NG", name: "Igbo", nativeName: "Igbo" },
  { code: "id", bcp47: "id-ID", name: "Indonesian", nativeName: "Bahasa Indonesia" },
  { code: "ga", bcp47: "ga-IE", name: "Irish", nativeName: "Gaeilge" },
  { code: "it", bcp47: "it-IT", name: "Italian", nativeName: "Italiano" },
  { code: "ja", bcp47: "ja-JP", name: "Japanese", nativeName: "日本語" },
  { code: "jv", bcp47: "jv-ID", name: "Javanese", nativeName: "Basa Jawa" },
  { code: "kn", bcp47: "kn-IN", name: "Kannada", nativeName: "ಕನ್ನಡ" },
  { code: "kk", bcp47: "kk-KZ", name: "Kazakh", nativeName: "Қазақ тілі" },
  { code: "km", bcp47: "km-KH", name: "Khmer", nativeName: "ភាសាខ្មែរ" },
  { code: "ko", bcp47: "ko-KR", name: "Korean", nativeName: "한국어" },
  { code: "ku", bcp47: "ku-TR", name: "Kurdish", nativeName: "Kurdî" },
  { code: "ky", bcp47: "ky-KG", name: "Kyrgyz", nativeName: "Кыргызча" },
  { code: "lo", bcp47: "lo-LA", name: "Lao", nativeName: "ລາວ" },
  { code: "la", bcp47: "la", name: "Latin", nativeName: "Latina" },
  { code: "lv", bcp47: "lv-LV", name: "Latvian", nativeName: "Latviešu" },
  { code: "lt", bcp47: "lt-LT", name: "Lithuanian", nativeName: "Lietuvių" },
  { code: "mk", bcp47: "mk-MK", name: "Macedonian", nativeName: "Македонски" },
  { code: "ms", bcp47: "ms-MY", name: "Malay", nativeName: "Bahasa Melayu" },
  { code: "ml", bcp47: "ml-IN", name: "Malayalam", nativeName: "മലയാളം" },
  { code: "mt", bcp47: "mt-MT", name: "Maltese", nativeName: "Malti" },
  { code: "mr", bcp47: "mr-IN", name: "Marathi", nativeName: "मराठी" },
  { code: "mn", bcp47: "mn-MN", name: "Mongolian", nativeName: "Монгол" },
  { code: "ne", bcp47: "ne-NP", name: "Nepali", nativeName: "नेपाली" },
  { code: "no", bcp47: "nb-NO", name: "Norwegian", nativeName: "Norsk" },
  { code: "or", bcp47: "or-IN", name: "Odia", nativeName: "ଓଡ଼ିଆ" },
  { code: "ps", bcp47: "ps-AF", name: "Pashto", nativeName: "پښتو", rtl: true },
  { code: "fa", bcp47: "fa-IR", name: "Persian", nativeName: "فارسی", rtl: true },
  { code: "pl", bcp47: "pl-PL", name: "Polish", nativeName: "Polski" },
  { code: "pt", bcp47: "pt-PT", name: "Portuguese", nativeName: "Português" },
  { code: "pa", bcp47: "pa-IN", name: "Punjabi", nativeName: "ਪੰਜਾਬੀ" },
  { code: "ro", bcp47: "ro-RO", name: "Romanian", nativeName: "Română" },
  { code: "ru", bcp47: "ru-RU", name: "Russian", nativeName: "Русский" },
  { code: "sa", bcp47: "sa-IN", name: "Sanskrit", nativeName: "संस्कृतम्" },
  { code: "sr", bcp47: "sr-RS", name: "Serbian", nativeName: "Српски" },
  { code: "sd", bcp47: "sd-PK", name: "Sindhi", nativeName: "سنڌي", rtl: true },
  { code: "si", bcp47: "si-LK", name: "Sinhala", nativeName: "සිංහල" },
  { code: "sk", bcp47: "sk-SK", name: "Slovak", nativeName: "Slovenčina" },
  { code: "sl", bcp47: "sl-SI", name: "Slovenian", nativeName: "Slovenščina" },
  { code: "so", bcp47: "so-SO", name: "Somali", nativeName: "Soomaali" },
  { code: "es", bcp47: "es-ES", name: "Spanish", nativeName: "Español" },
  { code: "su", bcp47: "su-ID", name: "Sundanese", nativeName: "Basa Sunda" },
  { code: "sw", bcp47: "sw-KE", name: "Swahili", nativeName: "Kiswahili" },
  { code: "sv", bcp47: "sv-SE", name: "Swedish", nativeName: "Svenska" },
  { code: "ta", bcp47: "ta-IN", name: "Tamil", nativeName: "தமிழ்" },
  { code: "te", bcp47: "te-IN", name: "Telugu", nativeName: "తెలుగు" },
  { code: "th", bcp47: "th-TH", name: "Thai", nativeName: "ไทย" },
  { code: "tr", bcp47: "tr-TR", name: "Turkish", nativeName: "Türkçe" },
  { code: "uk", bcp47: "uk-UA", name: "Ukrainian", nativeName: "Українська" },
  { code: "ur", bcp47: "ur-PK", name: "Urdu", nativeName: "اردو", rtl: true },
  { code: "uz", bcp47: "uz-UZ", name: "Uzbek", nativeName: "Oʻzbek" },
  { code: "vi", bcp47: "vi-VN", name: "Vietnamese", nativeName: "Tiếng Việt" },
  { code: "cy", bcp47: "cy-GB", name: "Welsh", nativeName: "Cymraeg" },
  { code: "xh", bcp47: "xh-ZA", name: "Xhosa", nativeName: "isiXhosa" },
  { code: "yi", bcp47: "yi", name: "Yiddish", nativeName: "ייִדיש", rtl: true },
  { code: "yo", bcp47: "yo-NG", name: "Yoruba", nativeName: "Yorùbá" },
  { code: "zu", bcp47: "zu-ZA", name: "Zulu", nativeName: "isiZulu" },
];

export const SUPPORTED_LANGUAGES: Language[] = [...RAW_LANGUAGES].sort((a, b) =>
  a.name.localeCompare(b.name)
);

export function filterLanguages(query: string): Language[] {
  const q = query.trim().toLowerCase();
  if (!q) return SUPPORTED_LANGUAGES;
  return SUPPORTED_LANGUAGES.filter(
    (l) =>
      l.name.toLowerCase().includes(q) ||
      l.nativeName.toLowerCase().includes(q) ||
      l.code.toLowerCase().includes(q)
  );
}

export function findLanguage(nameOrCode?: string | null): Language | undefined {
  if (!nameOrCode) return undefined;
  const q = nameOrCode.trim().toLowerCase();
  return SUPPORTED_LANGUAGES.find(
    (l) =>
      l.name.toLowerCase() === q ||
      l.code.toLowerCase() === q ||
      l.bcp47.toLowerCase() === q
  );
}

export function isRtlLanguage(nameOrCode?: string | null): boolean {
  return Boolean(findLanguage(nameOrCode)?.rtl);
}
