import enTranslations from "./en.json"
import idTranslations from "./id.json"
import esTranslations from "./es.json"
import frTranslations from "./fr.json"
import zhTranslations from "./zh.json"

export type LanguageData = {
  name: string
  nativeName: string
  translations: Record<string, string>
}

export type Languages = {
  [key: string]: LanguageData
}

export const LANGUAGES: Languages = {
  en: enTranslations,
  id: idTranslations,
  es: esTranslations,
  fr: frTranslations,
  zh: zhTranslations,
}

export type TranslationKey = keyof typeof enTranslations.translations
