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
import { useAuth } from "./auth-context";
import { cloudUtils } from "@/utils/storage-utils";

// ---------- Helpers ----------
const isColorDark = (hex: string): boolean => {
  const [r, g, b] = [0, 2, 4].map(
    (i) => parseInt(hex.slice(i + 1, i + 3), 16) || 0,
  );
  const brightness = Math.sqrt(
    0.299 * r ** 2 + 0.587 * g ** 2 + 0.114 * b ** 2,
  );
  return brightness < 128;
};

const applyCssVars = (theme: ThemePreset) => {
  const vars = {
    "--main-color": theme.main,
    "--main-color-hover": theme.mainHover,
    "--app-background": theme.background,
    "--app-text": theme.text,
    "--app-subtext": theme.subtext,
    "--app-border": theme.border,
    "--app-card": theme.card,
    "--app-accent": theme.accent,
  };

  Object.entries(vars).forEach(([key, val]) => {
    document.documentElement.style.setProperty(key, val);
  });
};

// ---------- Types ----------
type LoadKey = "currentTheme" | "customTheme" | "favoriteTheme";
type SourceType = "settings" | "customThemes" | "userFavorites";

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

const keySourceMap: Record<
  LoadKey,
  { source: SourceType; isSetting: boolean }
> = {
  currentTheme: { source: "settings", isSetting: true },
  customTheme: { source: "customThemes", isSetting: false },
  favoriteTheme: { source: "userFavorites", isSetting: false },
};

// ---------- Provider ----------
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { setTheme } = useTheme();
  const { getItem, setItem, isStorageReady } = useStorage();
  const { thisUser, isCloud } = useAuth();

  const [currentTheme, setCurrentThemeState] = useState<ThemePreset>(
    builtInThemes[0],
  );
  const [customThemes, setCustomThemes] = useState<ThemePreset[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const previousThemeRef = useRef<string | null>(null);

  const allThemes = useMemo(
    () => [...builtInThemes, ...customThemes],
    [customThemes],
  );

  const loadFromStorage = async (key: LoadKey, setter: (val: any) => void) => {
    const { source } = keySourceMap[key];
    try {
      if (thisUser && isCloud) {
        const [data] = await cloudUtils.get(source, thisUser.id);
        const value =
          source === "customThemes" ? data?.contents ?? [] : data?.[key];
        setter(value ?? (key !== "currentTheme" ? [] : undefined));
      } else if (isStorageReady) {
        const value = await getItem(key);
        setter(value ?? (key !== "currentTheme" ? [] : undefined));
      }
    } catch (error) {
      console.error(`Failed to load ${key}:`, error);
    }
  };

  const updateStorage = async (
    key: LoadKey,
    value: any,
    setter: (val: any) => void,
  ) => {
    const { source } = keySourceMap[key];
    try {
      if (thisUser && isCloud) {
        const payload =
          source === "customThemes"
            ? {
                uid: thisUser.id,
                timestamp: Date.now(),
                contents: value,
              }
            : { uid: thisUser.id, [key]: value };
        await cloudUtils.set(source, payload, thisUser.id);
      } else if (isStorageReady) {
        await setItem(key, value);
      }
      setter(value);
    } catch (error) {
      console.error(`Failed to update ${key}:`, error);
    }
  };

  useEffect(() => {
    Object.entries({
      currentTheme: (v: any) => setCurrentThemeState(v ?? builtInThemes[0]),
      customTheme: (v: any) => setCustomThemes(v ?? []),
      favoriteTheme: (v: any) => setFavorites(v ?? []),
    }).forEach(([key, setter]) => loadFromStorage(key as LoadKey, setter));
  }, [isStorageReady, getItem, thisUser, isCloud]);

  useEffect(() => {
    if (!isStorageReady) return;

    applyCssVars(currentTheme);
    setItem("currentTheme", currentTheme);

    const newMode = isColorDark(currentTheme.background) ? "dark" : "light";
    if (previousThemeRef.current !== newMode) {
      previousThemeRef.current = newMode;
      setItem("themeMode", newMode);
      setTimeout(() => setTheme(newMode), 0);
    }
  }, [currentTheme, isStorageReady, setItem, setTheme]);

  useEffect(() => {
    if (isStorageReady) setItem("customThemes", customThemes);
  }, [customThemes, isStorageReady, setItem]);

  const setCurrentTheme = useCallback(
    (theme: ThemePreset) =>
      updateStorage("currentTheme", theme, setCurrentThemeState),
    [thisUser, isCloud, isStorageReady],
  );

  const favoriteTheme = useCallback(
    (name: string) => {
      const updated = favorites.includes(name)
        ? favorites.filter((n) => n !== name)
        : [...favorites, name];
      updateStorage("favoriteTheme", updated, setFavorites);
    },
    [favorites],
  );

  const isCustomTheme = useCallback(
    (name: string) => customThemes.some((t) => t.name === name),
    [customThemes],
  );

  const addCustomTheme = useCallback(
    (theme: ThemePreset) => {
      setCustomThemes((prev) => {
        const exists = prev.find((t) => t.name === theme.name);
        if (exists) return prev; // Skip if name already exists
        const updated = [...prev, theme];
        updateStorage("customTheme", updated, setCustomThemes);
        setCurrentTheme(theme); // Auto set theme
        return updated;
      });
    },
    [updateStorage, setCurrentTheme],
  );

  const updateCustomTheme = useCallback(
    (theme: ThemePreset) => {
      setCustomThemes((prev) => {
        const updated = prev.map((t) =>
          t.name === theme.name ? { ...t, ...theme } : t,
        );
        updateStorage("customTheme", updated, setCustomThemes);
        setCurrentTheme(theme); // Auto set theme
        return updated;
      });
    },
    [updateStorage, setCurrentTheme],
  );

  const deleteCustomTheme = useCallback(
    (name: string) => {
      setCustomThemes((prev) => {
        const updated = prev.filter((t) => t.name !== name);
        updateStorage("customTheme", updated, setCustomThemes);
        return updated;
      });
    },
    [updateStorage],
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
