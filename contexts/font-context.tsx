"use client";

import type React from "react";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  useRef,
  useMemo,
} from "react";
import { useActivity } from "./activity-context";
import { useStorage } from "@/contexts/storage-context";
import { useAuth } from "./auth-context";
import { cloudUtils } from "@/utils/storage-utils";
import {
  availableFonts,
  availableSizes,
  FontFamily,
  FontSize,
} from "@/data/fonts";

type FontContextType = {
  currentFont: FontFamily;
  setFont: (font: FontFamily) => void;
  availableFonts: FontFamily[];
  favorites: string[];
  toggleFavorite: (name: string) => void;
  fontSize: FontSize;
  setFontSize: (size: FontSize) => void;
  availableSizes: FontSize[];
};

type SettingKey = "appFont";
type FavoriteKey = "favoriteFont";

type LoadKey = SettingKey | FavoriteKey;
type SourceType = "settings" | "userFavorites";

interface LoadConfig {
  source: SourceType;
  isSetting: boolean;
}

const FontContext = createContext<FontContextType | undefined>(undefined);

export function FontProvider({ children }: { children: React.ReactNode }) {
  const [currentFont, setCurrentFont] = useState<FontFamily>(availableFonts[0]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [fontSize, setCurrentFontSize] = useState<FontSize>(availableSizes[2]);
  const { recordActivity } = useActivity();
  const { getItem, setItem, isStorageReady } = useStorage();
  const { thisUser, isCloud } = useAuth();
  const fontSizeRef = useRef<number | null>(null);

  const keySourceMap: Record<LoadKey, LoadConfig> = {
    appFont: { source: "settings", isSetting: true },
    favoriteFont: { source: "userFavorites", isSetting: false },
  };

  const genericLoad = async (key: LoadKey, setter: (val: any) => void) => {
    const { source } = keySourceMap[key];

    try {
      if (thisUser && isCloud) {
        const [data] = await Promise.all([cloudUtils.get(source, thisUser.id)]);
        const value = data?.[0]?.[key];
        if (value !== undefined) setter(value);
      } else {
        if (!isStorageReady) return;
        const value = await getItem(key);
        if (value !== undefined) setter(value);
      }
    } catch (error) {
      console.error(`Failed to load ${source} key "${key}":`, error);
    }
  };

  const genericUpdate = async (
    key: LoadKey,
    value: any,
    setter: (val: any) => void,
  ) => {
    const { source } = keySourceMap[key];

    try {
      if (thisUser && isCloud) {
        await cloudUtils.set(
          source,
          { uid: thisUser.id, [key]: value },
          thisUser.id,
        );
      }
      setter(value);
    } catch (error) {
      console.error(`Failed to update ${source} key "${key}":`, error);
    }
  };

  const initialLoaders: Record<LoadKey, (val: any) => void> = {
    appFont: (val) => setCurrentFont(val ?? availableFonts[0]),
    favoriteFont: (val) => setFavorites(val ?? []),
  };

  useEffect(() => {
    Object.entries(initialLoaders).forEach(([key, setter]) => {
      genericLoad(key as LoadKey, setter);
    });
  }, [isStorageReady, getItem, thisUser, isCloud]);

  useEffect(() => {
    const loadPreferencesFromStorage = async () => {
      if (!isStorageReady) return;

      try {
        const [savedFavorites, savedFontSize] = await Promise.all([
          getItem("favoriteFonts"),
          getItem("appFontSize"),
        ]);

        if (Array.isArray(savedFavorites)) {
          setFavorites(savedFavorites);
        }

        if (
          savedFontSize &&
          typeof savedFontSize.name === "string" &&
          typeof savedFontSize.value === "string" &&
          typeof savedFontSize.size === "number"
        ) {
          setCurrentFontSize(savedFontSize);
        }
      } catch (error) {
        console.error("⚠️ Error loading font preferences:", error);
      }
    };

    loadPreferencesFromStorage();
  }, [isStorageReady, getItem]);

  useEffect(() => {
    if (!isStorageReady) return;

    try {
      document.documentElement.style.setProperty(
        "--font-family",
        currentFont.value,
      );

      const styleId = "dynamic-font-style";
      let styleEl = document.getElementById(styleId) as HTMLStyleElement;

      if (!styleEl) {
        styleEl = document.createElement("style");
        styleEl.id = styleId;
        document.head.appendChild(styleEl);
      }

      styleEl.textContent = `
        * {
          font-family: ${currentFont.value} !important;
        }
      `;

      setItem("appFont", currentFont);
    } catch (error) {
      console.error("⚠️ Error saving font preference:", error);
    }
  }, [currentFont, isStorageReady, setItem]);

  useEffect(() => {
    if (!isStorageReady || fontSizeRef.current === fontSize.size) return;

    try {
      fontSizeRef.current = fontSize.size;
      document.documentElement.style.setProperty(
        "--font-size-base",
        `${fontSize.size}px`,
      );
      setItem("appFontSize", fontSize);
    } catch (error) {
      console.error("⚠️ Error saving font size preference:", error);
    }
  }, [fontSize, isStorageReady, setItem]);

  useEffect(() => {
    if (!isStorageReady) return;

    try {
      setItem("favoriteFonts", favorites);
    } catch (error) {
      console.error("⚠️ Error saving font favorites:", error);
    }
  }, [favorites, isStorageReady, setItem]);

  const setFont = (font: FontFamily) => {
    setCurrentFont(font);
    genericUpdate("appFont", font, setCurrentFont);
    recordActivity("font_changed", { fontName: font.name });
  };

  const setFontSize = (size: FontSize) => {
    if (size.size !== fontSize.size) {
      setCurrentFontSize(size);
      recordActivity("font_size_changed", { fontSize: size.size });
    }
  };

  const toggleFavorite = (name: string) => {
    const updatedFavorites = favorites.includes(name)
      ? favorites.filter((item) => item !== name)
      : [...favorites, name];
    // Persist to storage
    genericUpdate("favoriteFont", updatedFavorites, setFavorites);
  };

  const contextValue = useMemo(
    () => ({
      currentFont,
      setFont,
      availableFonts,
      favorites,
      toggleFavorite,
      fontSize,
      setFontSize,
      availableSizes,
    }),
    [currentFont, favorites, fontSize],
  );

  return (
    <FontContext.Provider value={contextValue}>{children}</FontContext.Provider>
  );
}

export function useFont() {
  const context = useContext(FontContext);
  if (context === undefined) {
    throw new Error("useFont must be used within a FontProvider");
  }
  return context;
}
