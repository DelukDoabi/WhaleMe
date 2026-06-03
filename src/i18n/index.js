import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import en from './locales/en.json';
import fr from './locales/fr.json';
import zhTW from './locales/zh-TW.json';
import ko from './locales/ko.json';
import es from './locales/es.json';
import pt from './locales/pt.json';
import de from './locales/de.json';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      fr: { translation: fr },
      'zh-TW': { translation: zhTW },
      ko: { translation: ko },
      es: { translation: es },
      pt: { translation: pt },
      de: { translation: de },
    },
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;
