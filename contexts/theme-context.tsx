"use client";

import type React from "react";
import { createContext, useContext, useEffect, useState, useRef } from "react";
import { useTheme } from "next-themes";
import { useStorage } from "@/contexts/storage-context";

export type ThemePreset = {
  name: string;
  background: string;
  main: string;
  mainHover: string;
  text: string;
  subtext: string;
  border: string;
  card: string;
  accent: string;
  isCustom?: boolean;
};

const builtInThemes: ThemePreset[] = [
  {
    name: "paper",
    background: "#ffffff",
    main: "#4b5563",
    mainHover: "#374151",
    text: "#111827",
    subtext: "#6b7280",
    border: "#e5e7eb",
    card: "#f9fafb",
    accent: "#4b5563",
  },
  {
    name: "prayoga.io",
    background: "#181818",
    main: "#6366f1",
    mainHover: "#4f46e5",
    text: "#ffffff",
    subtext: "#999999",
    border: "#333333",
    card: "#1f1f1f",
    accent: "#6366f1",
  },
  {
    name: "stealth",
    background: "#232323",
    main: "#3b82f6",
    mainHover: "#2563eb",
    text: "#eeeeee",
    subtext: "#aaaaaa",
    border: "#444444",
    card: "#2a2a2a",
    accent: "#3b82f6",
  },
  {
    name: "dino",
    background: "#ffffff",
    main: "#4ade80",
    mainHover: "#22c55e",
    text: "#333333",
    subtext: "#666666",
    border: "#e5e5e5",
    card: "#f5f5f5",
    accent: "#4ade80",
  },
  {
    name: "magic girl",
    background: "#ffffff",
    main: "#ec4899",
    mainHover: "#db2777",
    text: "#333333",
    subtext: "#666666",
    border: "#fce7f3",
    card: "#fdf2f8",
    accent: "#ec4899",
  },
  {
    name: "milkshake",
    background: "#ffffff",
    main: "#8b5cf6",
    mainHover: "#7c3aed",
    text: "#333333",
    subtext: "#666666",
    border: "#f3f4f6",
    card: "#f9fafb",
    accent: "#8b5cf6",
  },
  {
    name: "modern ink",
    background: "#ffffff",
    main: "#ef4444",
    mainHover: "#dc2626",
    text: "#111111",
    subtext: "#666666",
    border: "#e5e7eb",
    card: "#f9fafb",
    accent: "#ef4444",
  },
  {
    name: "solarized light",
    background: "#fdf6e3",
    main: "#b58900",
    mainHover: "#a77c00",
    text: "#073642",
    subtext: "#586e75",
    border: "#eee8d5",
    card: "#eee8d5",
    accent: "#b58900",
  },
  {
    name: "nord light",
    background: "#eceff4",
    main: "#5e81ac",
    mainHover: "#4c6f94",
    text: "#2e3440",
    subtext: "#4c566a",
    border: "#d8dee9",
    card: "#e5e9f0",
    accent: "#5e81ac",
  },
  {
    name: "pastel",
    background: "#fdf2f8",
    main: "#ec4899",
    mainHover: "#db2777",
    text: "#831843",
    subtext: "#9d174d",
    border: "#fbcfe8",
    card: "#fce7f3",
    accent: "#ec4899",
  },
  {
    name: "beach",
    background: "#f0f9ff",
    main: "#0ea5e9",
    mainHover: "#0284c7",
    text: "#0c4a6e",
    subtext: "#0369a1",
    border: "#e0f2fe",
    card: "#e0f2fe",
    accent: "#0ea5e9",
  },
  {
    name: "strawberry",
    background: "#fef2f2",
    main: "#ef4444",
    mainHover: "#dc2626",
    text: "#7f1d1d",
    subtext: "#b91c1c",
    border: "#fee2e2",
    card: "#fee2e2",
    accent: "#ef4444",
  },
  {
    name: "dark",
    background: "#1e1e2e",
    main: "#cba6f7",
    mainHover: "#b48eff",
    text: "#cdd6f4",
    subtext: "#a6adc8",
    border: "#313244",
    card: "#181825",
    accent: "#cba6f7",
  },
];

const ThemeContext = createContext<any | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { setTheme } = useTheme();
  const { getItem, setItem, isStorageReady } = useStorage();
  const [currentTheme, setCurrentThemeState] = useState<ThemePreset>(
    builtInThemes[0],
  );
  const [favorites, setFavorites] = useState<string[]>([]);
  const [customThemes, setCustomThemes] = useState<ThemePreset[]>([]);
  const previousThemeRef = useRef<string | null>(null);

  useEffect(() => {
    if (!isStorageReady) return;

    const loadThemeData = async () => {
      try {
        // Get saved theme, favorites, and custom themes from storage
        const savedTheme = await getItem("currentTheme");
        const savedFavorites = await getItem("favoriteThemes");
        const savedCustomThemes = await getItem("customThemes");

        // Set the current theme and apply the correct mode (light/dark)
        if (savedTheme) {
          setCurrentThemeState(savedTheme);

          // Check if the background color is dark to determine theme mode
          const darkMode = isColorDark(savedTheme.background);
          setTheme(darkMode ? "dark" : "light");
        }

        // Set saved favorites and custom themes
        if (savedFavorites) setFavorites(savedFavorites);
        if (savedCustomThemes) setCustomThemes(savedCustomThemes);
      } catch (error) {
        console.error("Theme loading error:", error);
      }
    };

    loadThemeData();
  }, [isStorageReady]);

  useEffect(() => {
    if (!isStorageReady) return;
    const vars = {
      "--main-color": currentTheme.main,
      "--main-color-hover": currentTheme.mainHover,
      "--app-background": currentTheme.background,
      "--app-text": currentTheme.text,
      "--app-subtext": currentTheme.subtext,
      "--app-border": currentTheme.border,
      "--app-card": currentTheme.card,
      "--app-accent": currentTheme.accent,
    };
    Object.entries(vars).forEach(([key, val]) => {
      document.documentElement.style.setProperty(key, val);
    });

    setItem("currentTheme", currentTheme);

    const dark = isColorDark(currentTheme.background);
    const newTheme = dark ? "dark" : "light";

    if (previousThemeRef.current !== newTheme) {
      previousThemeRef.current = newTheme;
      setItem("themeMode", newTheme);
      setTimeout(() => setTheme(newTheme), 0);
    }
  }, [currentTheme, isStorageReady]);

  useEffect(() => {
    if (isStorageReady) setItem("favoriteThemes", favorites);
  }, [favorites, isStorageReady]);

  useEffect(() => {
    if (isStorageReady) setItem("customThemes", customThemes);
  }, [customThemes, isStorageReady]);

  const setCurrentTheme = (theme: ThemePreset) => setCurrentThemeState(theme);

  const favoriteTheme = (name: string) => {
    setFavorites((prev) =>
      prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name],
    );
  };

  const addCustomTheme = (theme: ThemePreset) => {
    const marked = { ...theme, isCustom: true };
    setCustomThemes((prev) => {
      const index = prev.findIndex((t) => t.name === theme.name);
      if (index >= 0) {
        const copy = [...prev];
        copy[index] = marked;
        return copy;
      }
      return [...prev, marked];
    });
    setCurrentThemeState(marked);
  };

  const updateCustomTheme = (theme: ThemePreset) => {
    const updated = { ...theme, isCustom: true };
    setCustomThemes((prev) =>
      prev.map((t) => (t.name === theme.name ? updated : t)),
    );
    if (currentTheme.name === theme.name) setCurrentThemeState(updated);
  };

  const deleteCustomTheme = (name: string) => {
    setCustomThemes((prev) => prev.filter((t) => t.name !== name));
    if (currentTheme.name === name) setCurrentThemeState(builtInThemes[0]);
    setFavorites((prev) => prev.filter((n) => n !== name));
  };

  const isCustomTheme = (name: string) =>
    customThemes.some((t) => t.name === name);

  const isColorDark = (hex: string): boolean => {
    const c = hex.replace("#", "");
    const r = parseInt(c.slice(0, 2), 16) || 0;
    const g = parseInt(c.slice(2, 4), 16) || 0;
    const b = parseInt(c.slice(4, 6), 16) || 0;
    const brightness = Math.sqrt(
      0.299 * r ** 2 + 0.587 * g ** 2 + 0.114 * b ** 2,
    );
    return brightness < 128;
  };

  const allThemes = [...builtInThemes, ...customThemes];

  return (
    <ThemeContext.Provider
      value={{
        currentTheme,
        setCurrentTheme,
        themePresets: allThemes,
        favoriteTheme,
        favorites,
        addCustomTheme,
        updateCustomTheme,
        deleteCustomTheme,
        isCustomTheme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useAppTheme() {
  const context = useContext(ThemeContext);
  if (!context)
    throw new Error("useAppTheme must be used within a ThemeProvider");
  return context;
}

export const themePresets = builtInThemes;
