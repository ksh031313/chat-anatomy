import i18next from "i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import HttpApi from "i18next-http-backend";
import { initReactI18next } from "react-i18next";

import daTranslation from "../locales/da/translation.json";
import enTranslation from "../locales/en/translation.json";
import esTranslation from "../locales/es/translation.json";
import frTranslation from "../locales/fr/translation.json";
import jaTranslation from "../locales/ja/translation.json";
import nlTranslation from "../locales/nl/translation.json";
import ptBRTranslation from "../locales/ptBR/translation.json";
import trTranslation from "../locales/tr/translation.json";
import itTranslation from "../locales/it/translation.json";
import koTranslation from "../locales/ko/translation.json"; // 1. ko 번역 import

export const supportedLngs: { [key: string]: { name: string; locale: string } } = {
    da: {
        name: "Dansk",
        locale: "da-DK"
    },
    en: {
        name: "English",
        locale: "en-US"
    },
    es: {
        name: "Español",
        locale: "es-ES"
    },
    fr: {
        name: "Français",
        locale: "fr-FR"
    },
    ja: {
        name: "日本語",
        locale: "ja-JP"
    },
    nl: {
        name: "Nederlands",
        locale: "nl-NL"
    },
    ptBR: {
        name: "Português Brasileiro",
        locale: "pt-BR"
    },
    tr: {
        name: "Türkçe",
        locale: "tr-TR"
    },
    it: {
        name: "Italiano",
        locale: "it-IT"
    },
    ko: { // 2. ko 추가
        name: "한국어",
        locale: "ko-KR"
    }
};

i18next
    .use(HttpApi)
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
        resources: {
            da: { translation: daTranslation },
            en: { translation: enTranslation },
            es: { translation: esTranslation },
            fr: { translation: frTranslation },
            ja: { translation: jaTranslation },
            nl: { translation: nlTranslation },
            ptBR: { translation: ptBRTranslation },
            tr: { translation: trTranslation },
            it: { translation: itTranslation },
            ko: { translation: koTranslation } // 3. ko 추가
        },
        lng: "ko", // 항상 한국어로 고정
        fallbackLng: "ko",
        supportedLngs: Object.keys(supportedLngs),
        debug: import.meta.env.DEV,
        interpolation: {
            escapeValue: false // not needed for react as it escapes by default
        }
    });

export default i18next;
