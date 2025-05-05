"use client";

import type React from "react";
import { createContext, useContext, useEffect, useState } from "react";
import { LANGUAGES, type TranslationKey } from "@/translations";
import { useStorage } from "@/contexts/storage-context";

// Type for our language context
type LanguageContextType = {
  currentLanguage: string;
  setLanguage: (code: string) => void;
  t: (key: TranslationKey) => string;
  availableLanguages: typeof LANGUAGES;
};

const LanguageContext = createContext<LanguageContextType | undefined>(
  undefined,
);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [currentLanguage, setCurrentLanguage] = useState<string>("en");
  const { getItem, setItem, isStorageReady } = useStorage();

  useEffect(() => {
    if (!isStorageReady) return;

    const loadLanguage = async () => {
      try {
        // Try to get saved language from storage
        const savedLanguage = await getItem("appLanguage");
        if (savedLanguage) {
          setCurrentLanguage(savedLanguage);
        } else {
          // Detect browser language and set it if supported
          const browserLang = navigator.language.split("-")[0]; // Get language code part only
          const defaultLanguage = Object.keys(LANGUAGES).includes(browserLang)
            ? browserLang
            : "en";
          setCurrentLanguage(defaultLanguage);
        }
      } catch (error) {
        console.error("Error loading language preference:", error);
      }
    };

    loadLanguage();
  }, [isStorageReady, getItem]);

  // Save language preference to storage whenever it changes
  useEffect(() => {
    if (!isStorageReady) return;
    setItem("appLanguage", currentLanguage);
  }, [currentLanguage, isStorageReady, setItem]);

  // Translation function
  const t = (key: TranslationKey): string => {
    // @ts-ignore - We know the language and key exist
    return (
      LANGUAGES[currentLanguage]?.translations[key] ||
      LANGUAGES.en.translations[key]
    );
  };

  // Set language function
  const setLanguage = (code: string) => {
    if (Object.keys(LANGUAGES).includes(code)) {
      setCurrentLanguage(code);
    }
  };

  return (
    <LanguageContext.Provider
      value={{
        currentLanguage,
        setLanguage,
        t,
        availableLanguages: LANGUAGES,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

// Hook to use language context
export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}
