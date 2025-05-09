"use client";

import type React from "react";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  useRef,
  useMemo,
  useCallback,
} from "react";
import { useTheme } from "next-themes";
import { useStorage } from "@/contexts/storage-context";
import { builtInThemes, ThemePreset } from "@/data/themes";

// Helper function
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

interface ThemeContextType {
  currentTheme: ThemePreset;
  setCurrentTheme: (theme: ThemePreset) => void;
  themePresets: ThemePreset[];
  favoriteTheme: (name: string) => void;
  favorites: string[];
  addCustomTheme: (theme: ThemePreset) => void;
  updateCustomTheme: (theme: ThemePreset) => void;
  deleteCustomTheme: (name: string) => void;
  isCustomTheme: (name: string) => boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { setTheme } = useTheme();
  const { getItem, setItem, isStorageReady } = useStorage();
  const [currentTheme, setCurrentThemeState] = useState<ThemePreset>(
    builtInThemes[0],
  );
  const [favorites, setFavorites] = useState<string[]>([]);
  const [customThemes, setCustomThemes] = useState<ThemePreset[]>([]);
  const previousThemeRef = useRef<string | null>(null);
  const initializedRef = useRef(false);

  const allThemes = useMemo(
    () => [...builtInThemes, ...customThemes],
    [customThemes],
  );

  // Load theme, favorites, and customThemes
  useEffect(() => {
    if (!isStorageReady || initializedRef.current) return;

    initializedRef.current = true;

    (async () => {
      try {
        const [savedTheme, savedFavorites, savedCustomThemes] =
          await Promise.all([
            getItem("currentTheme"),
            getItem("favorites"),
            getItem("customThemes"),
          ]);

        if (savedTheme) {
          setCurrentThemeState(savedTheme);
          setTheme(isColorDark(savedTheme.background) ? "dark" : "light");
        }

        if (Array.isArray(savedFavorites)) {
          setFavorites(savedFavorites);
        }

        if (Array.isArray(savedCustomThemes)) {
          setCustomThemes(savedCustomThemes);
        }
      } catch (error) {
        console.error("Theme loading error:", error);
      }
    })();
  }, [isStorageReady, getItem, setTheme]);

  // Sync currentTheme to storage
  useEffect(() => {
    if (!isStorageReady) return;

    const cssVars = {
      "--main-color": currentTheme.main,
      "--main-color-hover": currentTheme.mainHover,
      "--app-background": currentTheme.background,
      "--app-text": currentTheme.text,
      "--app-subtext": currentTheme.subtext,
      "--app-border": currentTheme.border,
      "--app-card": currentTheme.card,
      "--app-accent": currentTheme.accent,
    };

    for (const [key, val] of Object.entries(cssVars)) {
      document.documentElement.style.setProperty(key, val);
    }

    setItem("currentTheme", currentTheme);

    const newMode = isColorDark(currentTheme.background) ? "dark" : "light";
    if (previousThemeRef.current !== newMode) {
      previousThemeRef.current = newMode;
      setItem("themeMode", newMode);
      setTimeout(() => setTheme(newMode), 0);
    }
  }, [currentTheme, isStorageReady, setItem, setTheme]);

  // Sync favorites to storage
  useEffect(() => {
    if (isStorageReady) setItem("favorites", favorites);
  }, [favorites, isStorageReady, setItem]);

  // Sync customThemes to storage
  useEffect(() => {
    if (isStorageReady) setItem("customThemes", customThemes);
  }, [customThemes, isStorageReady, setItem]);

  // Handlers
  const setCurrentTheme = useCallback((theme: ThemePreset) => {
    setCurrentThemeState(theme);
  }, []);

  const favoriteTheme = useCallback((name: string) => {
    setFavorites((prev) => {
      const updated = prev.includes(name)
        ? prev.filter((n) => n !== name)
        : [...prev, name];
      return updated;
    });
  }, []);

  const addCustomTheme = useCallback((theme: ThemePreset) => {
    const marked = { ...theme, isCustom: true };

    setCustomThemes((prev) => {
      const exists = prev.some((t) => t.name === marked.name);
      const updated = exists
        ? prev.map((t) => (t.name === marked.name ? marked : t))
        : [...prev, marked];
      return updated;
    });

    setCurrentThemeState(marked);
  }, []);

  const updateCustomTheme = useCallback(
    (theme: ThemePreset) => {
      const updated = { ...theme, isCustom: true };
      setCustomThemes((prev) =>
        prev.map((t) => (t.name === theme.name ? updated : t)),
      );
      if (currentTheme.name === theme.name) {
        setCurrentThemeState(updated);
      }
    },
    [currentTheme.name],
  );

  const deleteCustomTheme = useCallback(
    (name: string) => {
      setCustomThemes((prev) => prev.filter((t) => t.name !== name));
      if (currentTheme.name === name) {
        setCurrentThemeState(builtInThemes[0]);
      }
      setFavorites((prev) => prev.filter((n) => n !== name));
    },
    [currentTheme.name],
  );

  const isCustomTheme = useCallback(
    (name: string) => customThemes.some((t) => t.name === name),
    [customThemes],
  );

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

export function useAppTheme(): ThemeContextType {
  const context = useContext(ThemeContext);
  if (!context)
    throw new Error("useAppTheme must be used within a ThemeProvider");
  return context;
}
