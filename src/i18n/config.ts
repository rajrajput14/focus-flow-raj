import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Import translation files
import en from './locales/en.json';
import hi from './locales/hi.json';
import bn from './locales/bn.json';
import ta from './locales/ta.json';
import te from './locales/te.json';
import mr from './locales/mr.json';
import ur from './locales/ur.json';
import gu from './locales/gu.json';
import kn from './locales/kn.json';
import ml from './locales/ml.json';
import or from './locales/or.json';
import pa from './locales/pa.json';
import as from './locales/as.json';
import ks from './locales/ks.json';
import sa from './locales/sa.json';
import kok from './locales/kok.json';
import mni from './locales/mni.json';
import ne from './locales/ne.json';
import sd from './locales/sd.json';
import doi from './locales/doi.json';
import mai from './locales/mai.json';
import sat from './locales/sat.json';
import brx from './locales/brx.json';

// Define resources
const resources = {
  en: { translation: en },
  hi: { translation: hi },
  bn: { translation: bn },
  ta: { translation: ta },
  te: { translation: te },
  mr: { translation: mr },
  ur: { translation: ur },
  gu: { translation: gu },
  kn: { translation: kn },
  ml: { translation: ml },
  or: { translation: or },
  pa: { translation: pa },
  as: { translation: as },
  ks: { translation: ks },
  sa: { translation: sa },
  kok: { translation: kok },
  mni: { translation: mni },
  ne: { translation: ne },
  sd: { translation: sd },
  doi: { translation: doi },
  mai: { translation: mai },
  sat: { translation: sat },
  brx: { translation: brx },
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
