import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Import translation files
import en from './locales/en.json';
import hi from './locales/hi.json';
import bn from './locales/bn.json';
import ta from './locales/ta.json';

// Define resources
const resources = {
  en: { translation: en },
  hi: { translation: hi },
  bn: { translation: bn },
  ta: { translation: ta },
  // Add more languages as translation files are created
  te: { translation: en }, // Telugu - fallback to English for now
  mr: { translation: en }, // Marathi - fallback to English for now
  ur: { translation: en }, // Urdu - fallback to English for now
  gu: { translation: en }, // Gujarati - fallback to English for now
  kn: { translation: en }, // Kannada - fallback to English for now
  ml: { translation: en }, // Malayalam - fallback to English for now
  or: { translation: en }, // Odia - fallback to English for now
  pa: { translation: en }, // Punjabi - fallback to English for now
  as: { translation: en }, // Assamese - fallback to English for now
  ks: { translation: en }, // Kashmiri - fallback to English for now
  sa: { translation: en }, // Sanskrit - fallback to English for now
  kok: { translation: en }, // Konkani - fallback to English for now
  mni: { translation: en }, // Manipuri - fallback to English for now
  ne: { translation: en }, // Nepali - fallback to English for now
  sd: { translation: en }, // Sindhi - fallback to English for now
  doi: { translation: en }, // Dogri - fallback to English for now
  mai: { translation: en }, // Maithili - fallback to English for now
  sat: { translation: en }, // Santali - fallback to English for now
  brx: { translation: en }, // Bodo - fallback to English for now
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: localStorage.getItem('userLanguage') || 'en',
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
    react: {
      useSuspense: false,
    },
  });

export default i18n;
