"use client";

import type React from "react";
import { createContext, useContext, useEffect, useState } from "react";
import { LANGUAGES, type TranslationKey } from "@/translations";
import { useStorage } from "@/contexts/storage-context";
import { useAuth } from "./auth-context";
import { cloudUtils } from "@/utils/storage-utils";

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
  const [currentLanguage, setCurrentLanguage] = useState<string>(
    navigator.language.split("-")[0],
  );
  const { setItem, getItem, isStorageReady } = useStorage();
  const { thisUser, isCloud } = useAuth();

  // Define allowed keys for shared setting logic
  type SettingKey = "appLanguage";

  // Load a setting from cloud/local
  const loadSetting = async (key: SettingKey, setter: (val: any) => void) => {
    try {
      if (thisUser && isCloud) {
        const [settings] = await Promise.all([
          cloudUtils.get("settings", thisUser.id),
        ]);
        const value = settings?.[0]?.[key];
        if (value !== undefined) setter(value);
      } else {
        if (!isStorageReady) return;
        const value = await getItem(key);
        if (value !== undefined) setter(value);
      }
    } catch (error) {
      console.error(`Failed to load setting "${key}":`, error);
    }
  };

  // Save a setting to cloud/local
  const updateSetting = async (
    key: SettingKey,
    value: any,
    setter: (val: any) => void,
  ) => {
    try {
      if (thisUser && isCloud) {
        await cloudUtils.set(
          "settings",
          { uid: thisUser.id, [key]: value },
          thisUser.id,
        );
      } else {
        setItem(key, value);
      }
      setter(value);
    } catch (error) {
      console.error(`Failed to update setting "${key}":`, error);
    }
  };

  // Keys and setters for loading on mount
  const settingLoaders: Record<SettingKey, (val: any) => void> = {
    appLanguage: (val) =>
      setCurrentLanguage(val ?? navigator.language.split("-")[0]),
  };

  // Load settings (activeTab + settingsDrawerOpen)
  useEffect(() => {
    Object.entries(settingLoaders).forEach(([key, setter]) => {
      loadSetting(key as SettingKey, setter);
    });
  }, [isStorageReady, getItem, thisUser, isCloud]);

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
      updateSetting("appLanguage", code, setCurrentLanguage);
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
