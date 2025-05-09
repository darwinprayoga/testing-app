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

type FontFamily = {
  name: string;
  value: string;
};

type FontSize = {
  name: string;
  value: string;
  size: number;
};

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

const availableFonts: FontFamily[] = [
  { name: "Source Sans Pro", value: "'Source Sans Pro', sans-serif" },
  { name: "Poppins", value: "'Poppins', sans-serif" },
  { name: "Montserrat", value: "'Montserrat', sans-serif" },
  { name: "Inter", value: "'Inter', sans-serif" },
  { name: "Roboto", value: "'Roboto', sans-serif" },
  { name: "Open Sans", value: "'Open Sans', sans-serif" },
  { name: "Lato", value: "'Lato', sans-serif" },
  { name: "Raleway", value: "'Raleway', sans-serif" },
  { name: "Ubuntu", value: "'Ubuntu', sans-serif" },
  { name: "Playfair Display", value: "'Playfair Display', serif" },
  { name: "Merriweather", value: "'Merriweather', serif" },
  { name: "Nunito", value: "'Nunito', sans-serif" },
];

const availableSizes: FontSize[] = [
  { name: "Extra Small", value: "xs", size: 12 },
  { name: "Small", value: "sm", size: 14 },
  { name: "Medium", value: "md", size: 16 },
  { name: "Large", value: "lg", size: 18 },
  { name: "Extra Large", value: "xl", size: 20 },
  { name: "2XL", value: "2xl", size: 24 },
];

const FontContext = createContext<FontContextType | undefined>(undefined);

export function FontProvider({ children }: { children: React.ReactNode }) {
  const [currentFont, setCurrentFont] = useState<FontFamily>(availableFonts[0]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [fontSize, setCurrentFontSize] = useState<FontSize>(availableSizes[2]);
  const { recordActivity } = useActivity();
  const { getItem, setItem, isStorageReady } = useStorage();

  const fontSizeRef = useRef<number | null>(null);

  useEffect(() => {
    const loadPreferencesFromStorage = async () => {
      if (!isStorageReady) return;

      try {
        const [savedFont, savedFavorites, savedFontSize] = await Promise.all([
          getItem("appFont"),
          getItem("favoriteFonts"),
          getItem("appFontSize"),
        ]);

        if (
          savedFont &&
          typeof savedFont.name === "string" &&
          typeof savedFont.value === "string"
        ) {
          setCurrentFont(savedFont);
        }

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
    recordActivity("font_changed", { fontName: font.name });
  };

  const setFontSize = (size: FontSize) => {
    if (size.size !== fontSize.size) {
      setCurrentFontSize(size);
      recordActivity("font_size_changed", { fontSize: size.size });
    }
  };

  const toggleFavorite = (name: string) => {
    setFavorites((prev) =>
      prev.includes(name) ? prev.filter((f) => f !== name) : [...prev, name],
    );
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
