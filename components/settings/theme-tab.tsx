"use client";

import type React from "react";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Plus, Star } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useLanguage } from "@/contexts/language-context";
import { useAppTheme } from "@/contexts/theme-context";
import { ThemeButton } from "./theme-button";
import { ThemeEditor } from "./theme-editor";
import { ThemeDeleteDialog } from "./theme-delete-dialog";
import { useToast } from "@/components/ui/use-toast";

interface ThemeTabProps {
  searchQuery: string;
  onSearchChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export function ThemeTab({ searchQuery, onSearchChange }: ThemeTabProps) {
  const { t } = useLanguage();
  const { toast } = useToast();
  const {
    currentTheme,
    setCurrentTheme,
    themePresets,
    favoriteTheme,
    favorites,
    addCustomTheme,
    updateCustomTheme,
    deleteCustomTheme,
    isCustomTheme,
  } = useAppTheme();

  const [isCreatingTheme, setIsCreatingTheme] = useState(false);
  const [isEditingTheme, setIsEditingTheme] = useState(false);
  const [customTheme, setCustomTheme] = useState({
    name: "",
    background: "#ffffff",
    main: "#3b82f6",
    mainHover: "#2563eb",
    text: "#333333",
    subtext: "#666666",
    border: "#e5e7eb",
    card: "#f9fafb",
    accent: "#3b82f6",
  });
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [themeToDelete, setThemeToDelete] = useState<string | null>(null);

  const filteredPresets = themePresets.filter((preset: any) =>
    preset.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );
  const favoritePresets = themePresets.filter((preset: any) =>
    favorites.includes(preset.name),
  );

  // Function to generate a random color
  const generateRandomColor = () => {
    return (
      "#" +
      Math.floor(Math.random() * 16777215)
        .toString(16)
        .padStart(6, "0")
    );
  };

  // Function to generate a random theme
  const generateRandomTheme = () => {
    const mainColor = generateRandomColor();
    const mainHoverColor = adjustColorBrightness(mainColor, -20);
    const bgColor = Math.random() > 0.5 ? "#ffffff" : "#1e1e2e";
    const isDark = isColorDark(bgColor);

    setCustomTheme({
      ...customTheme,
      background: bgColor,
      main: mainColor,
      mainHover: mainHoverColor,
      text: isDark ? "#cdd6f4" : "#333333",
      subtext: isDark ? "#a6adc8" : "#666666",
      border: isDark ? "#313244" : "#e5e7eb",
      card: isDark ? "#181825" : "#f9fafb",
      accent: mainColor,
    });
  };

  // Function to adjust color brightness
  const adjustColorBrightness = (hex: string, percent: number) => {
    let r = Number.parseInt(hex.substring(1, 3), 16);
    let g = Number.parseInt(hex.substring(3, 5), 16);
    let b = Number.parseInt(hex.substring(5, 7), 16);

    r = Math.max(0, Math.min(255, r + (r * percent) / 100));
    g = Math.max(0, Math.min(255, g + (g * percent) / 100));
    b = Math.max(0, Math.min(255, b + (b * percent) / 100));

    return `#${Math.round(r).toString(16).padStart(2, "0")}${Math.round(g)
      .toString(16)
      .padStart(2, "0")}${Math.round(b).toString(16).padStart(2, "0")}`;
  };

  // Function to determine if a color is dark
  const isColorDark = (color: string): boolean => {
    const hex = color.replace("#", "");
    const r = Number.parseInt(hex.substring(0, 2), 16) || 0;
    const g = Number.parseInt(hex.substring(2, 4), 16) || 0;
    const b = Number.parseInt(hex.substring(4, 6), 16) || 0;

    const brightness = Math.sqrt(
      0.299 * (r * r) + 0.587 * (g * g) + 0.114 * (b * b),
    );
    return brightness < 128;
  };

  // Function to generate a random theme name
  const generateRandomThemeName = () => {
    const adjectives = ["cosmic", "mystic", "vibrant", "serene", "electric"];
    const nouns = ["wave", "horizon", "sunset", "dawn", "breeze"];

    const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
    const noun = nouns[Math.floor(Math.random() * nouns.length)];

    return `${adj} ${noun}`;
  };

  // Function to start creating a new theme
  const startCreatingTheme = () => {
    setIsCreatingTheme(true);
    setIsEditingTheme(false);
    setCustomTheme({
      name: generateRandomThemeName(),
      background: "#ffffff",
      main: "#3b82f6",
      mainHover: "#2563eb",
      text: "#333333",
      subtext: "#666666",
      border: "#e5e7eb",
      card: "#f9fafb",
      accent: "#3b82f6",
    });
  };

  // Function to start editing an existing theme
  const startEditingTheme = (theme: any) => {
    setIsCreatingTheme(true);
    setIsEditingTheme(true);
    setCustomTheme({
      name: theme.name,
      background: theme.background,
      main: theme.main,
      mainHover: theme.mainHover,
      text: theme.text,
      subtext: theme.subtext,
      border: theme.border,
      card: theme.card,
      accent: theme.accent,
    });
  };

  // Function to save the custom theme
  const saveCustomTheme = () => {
    if (customTheme.name.trim() === "") {
      setCustomTheme({
        ...customTheme,
        name: generateRandomThemeName(),
      });
      return;
    }

    if (isEditingTheme) {
      updateCustomTheme(customTheme);
      toast({
        title: t("themeUpdated"),
        description: t("themeUpdatedDesc").replace("{name}", customTheme.name),
      });
    } else {
      addCustomTheme(customTheme);
      toast({
        title: t("themeCreated"),
        description: t("themeCreatedDesc").replace("{name}", customTheme.name),
      });
    }

    setIsCreatingTheme(false);
    setIsEditingTheme(false);
  };

  // Function to confirm theme deletion
  const confirmDeleteTheme = (name: string) => {
    setThemeToDelete(name);
    setDeleteConfirmOpen(true);
  };

  // Function to handle theme deletion
  const handleDeleteTheme = () => {
    if (themeToDelete) {
      deleteCustomTheme(themeToDelete);
      toast({
        title: t("themeDeleted"),
        description: t("themeDeletedDesc").replace("{name}", themeToDelete),
      });
      setThemeToDelete(null);
    }
    setDeleteConfirmOpen(false);
  };

  if (isCreatingTheme) {
    return (
      <ThemeEditor
        customTheme={customTheme}
        setCustomTheme={setCustomTheme}
        isEditingTheme={isEditingTheme}
        onCancel={() => {
          setIsCreatingTheme(false);
          setIsEditingTheme(false);
        }}
        onSave={saveCustomTheme}
        generateRandomTheme={generateRandomTheme}
        generateRandomThemeName={() =>
          setCustomTheme((prev) => ({
            ...prev,
            name: generateRandomThemeName(),
          }))
        }
      />
    );
  }

  return (
    <>
      <div className="mb-4 relative">
        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder={t("searchThemes")}
          value={searchQuery}
          onChange={onSearchChange}
          className="pl-8 pr-[130px]"
        />
        <Button
          variant="ghost"
          size="sm"
          onClick={startCreatingTheme}
          className="absolute right-[2px] top-[2px] flex items-center gap-1"
        >
          <Plus className="h-4 w-4" />
          {t("createTheme")}
        </Button>
      </div>

      <Tabs defaultValue="all">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="all">{t("allThemes")}</TabsTrigger>
          <TabsTrigger value="favorites">{t("favorites")}</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-2">
          <ScrollArea className="h-[350px] pr-4">
            <div className="grid grid-cols-1 gap-3 p-1">
              {filteredPresets.map((preset: any) => (
                <ThemeButton
                  key={preset.name}
                  preset={preset}
                  isActive={currentTheme.name === preset.name}
                  isFavorite={favorites.includes(preset.name)}
                  isCustom={isCustomTheme(preset.name)}
                  onSelect={() => setCurrentTheme(preset)}
                  onFavorite={() => favoriteTheme(preset.name)}
                  onEdit={
                    isCustomTheme(preset.name)
                      ? () => startEditingTheme(preset)
                      : undefined
                  }
                  onDelete={
                    isCustomTheme(preset.name)
                      ? () => confirmDeleteTheme(preset.name)
                      : undefined
                  }
                />
              ))}
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="favorites" className="mt-2">
          <ScrollArea className="h-[350px] pr-4">
            {favoritePresets.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-40 text-center">
                <Star className="h-10 w-10 text-muted-foreground mb-2" />
                <p className="text-muted-foreground">{t("noFavorites")}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {t("noFavoritesDesc")}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3 p-1">
                {favoritePresets.map((preset: any) => (
                  <ThemeButton
                    key={preset.name}
                    preset={preset}
                    isActive={currentTheme.name === preset.name}
                    isFavorite={true}
                    isCustom={isCustomTheme(preset.name)}
                    onSelect={() => setCurrentTheme(preset)}
                    onFavorite={() => favoriteTheme(preset.name)}
                    onEdit={
                      isCustomTheme(preset.name)
                        ? () => startEditingTheme(preset)
                        : undefined
                    }
                    onDelete={
                      isCustomTheme(preset.name)
                        ? () => confirmDeleteTheme(preset.name)
                        : undefined
                    }
                  />
                ))}
              </div>
            )}
          </ScrollArea>
        </TabsContent>
      </Tabs>

      <ThemeDeleteDialog
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        themeToDelete={themeToDelete}
        onDelete={handleDeleteTheme}
      />
    </>
  );
}
