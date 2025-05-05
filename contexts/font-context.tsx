"use client";

import type React from "react";
import { createContext, useContext, useEffect, useState, useRef } from "react";
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
  const [fontSize, setCurrentFontSize] = useState<FontSize>(availableSizes[2]); // Default to Medium
  const { recordActivity } = useActivity();
  const { getItem, setItem, isStorageReady } = useStorage();

  // Add a ref to track font size changes
  const fontSizeRef = useRef<number | null>(null);

  useEffect(() => {
    if (!isStorageReady) return;

    const loadPreferencesFromStorage = async () => {
      try {
        // Load font preference
        const savedFont = await getItem("appFont");
        if (savedFont) {
          setCurrentFont(savedFont);
        }

        // Load favorite fonts
        const savedFavorites = await getItem("favoriteFonts");
        if (savedFavorites) {
          setFavorites(savedFavorites);
        }

        // Load font size preference
        const savedFontSize = await getItem("appFontSize");
        if (savedFontSize) {
          setCurrentFontSize(savedFontSize);
        }
      } catch (error) {
        console.error("Error loading font preferences:", error);
      }
    };

    loadPreferencesFromStorage();
  }, [isStorageReady, getItem]);

  // Apply font to document and save to storage when it changes
  useEffect(() => {
    if (!isStorageReady) return;

    try {
      // Apply font family to the root element
      document.documentElement.style.setProperty(
        "--font-family",
        currentFont.value,
      );

      // Force font application by adding a style element
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
      console.error("Error saving font preference:", error);
    }
  }, [currentFont, isStorageReady, setItem]);

  // Apply font size to document and save to storage when it changes
  useEffect(() => {
    if (!isStorageReady) return;

    try {
      // Only update if the font size has actually changed
      if (fontSizeRef.current !== fontSize.size) {
        fontSizeRef.current = fontSize.size;

        // Set the base font size on the root element
        document.documentElement.style.setProperty(
          "--font-size-base",
          `${fontSize.size}px`,
        );

        setItem("appFontSize", fontSize);
      }
    } catch (error) {
      console.error("Error saving font size preference:", error);
    }
  }, [fontSize, isStorageReady, setItem]);

  // Save favorites to storage
  useEffect(() => {
    if (!isStorageReady) return;

    try {
      setItem("favoriteFonts", favorites);
    } catch (error) {
      console.error("Error saving font favorites:", error);
    }
  }, [favorites, isStorageReady, setItem]);

  const setFont = (font: FontFamily) => {
    setCurrentFont(font);
    recordActivity("font_changed", { fontName: font.name });
  };

  const setFontSize = (size: FontSize) => {
    // Only update if the size is different
    if (size.size !== fontSize.size) {
      setCurrentFontSize(size);
      recordActivity("font_size_changed", { fontSize: size.size });
    }
  };

  const toggleFavorite = (name: string) => {
    if (favorites.includes(name)) {
      setFavorites(favorites.filter((f) => f !== name));
    } else {
      setFavorites([...favorites, name]);
    }
  };

  return (
    <FontContext.Provider
      value={{
        currentFont,
        setFont,
        availableFonts,
        favorites,
        toggleFavorite,
        fontSize,
        setFontSize,
        availableSizes,
      }}
    >
      {children}
    </FontContext.Provider>
  );
}

export function useFont() {
  const context = useContext(FontContext);
  if (context === undefined) {
    throw new Error("useFont must be used within a FontProvider");
  }
  return context;
}
