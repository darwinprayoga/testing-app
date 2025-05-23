"use client";

import type React from "react";
import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Settings, Star, Languages, Type } from "lucide-react";
import { useLanguage } from "@/contexts/language-context";
import { useActivity } from "@/contexts/activity-context";
import { useStorage } from "@/contexts/storage-context";
import { ThemeTab } from "./theme-tab";
import { FontTab } from "./font-tab";
import { LanguageTab } from "./language-tab";
import { cloudUtils } from "@/utils/storage-utils";
import { useAuth } from "@/contexts/auth-context";

export function SettingsDrawer() {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("themes");

  const initializedRef = useRef(false);
  const { getItem, setItem, isStorageReady } = useStorage();
  const { t } = useLanguage();
  const { recordActivity, getLastActivity } = useActivity();
  const { thisUser, isCloud } = useAuth();

  // Define allowed keys for shared setting logic
  type SettingKey = "settingsDrawerOpen";

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
      }
      setter(value);
    } catch (error) {
      console.error(`Failed to update setting "${key}":`, error);
    }
  };

  // Keys and setters for loading on mount
  const settingLoaders: Record<SettingKey, (val: any) => void> = {
    settingsDrawerOpen: setOpen,
  };

  // Load settings (activeTab + settingsDrawerOpen)
  useEffect(() => {
    Object.entries(settingLoaders).forEach(([key, setter]) => {
      loadSetting(key as SettingKey, setter);
    });
  }, [isStorageReady, getItem, thisUser, isCloud]);

  // Update the handleDrawerChange function:
  const handleDrawerChange = (value: boolean) => {
    updateSetting("settingsDrawerOpen", value, setOpen);

    if (!isStorageReady) return;
    setItem("settingsDrawerOpen", value);
  };

  // Restore last known session activity (not persisted via settings)
  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;

    const lastTab = getLastActivity("tab_selected")?.details?.tabId;
    const lastSearch =
      getLastActivity("search_performed")?.details?.searchQuery;

    if (["themes", "fonts", "language"].includes(lastTab))
      setActiveTab(lastTab);
    if (lastSearch) setSearchQuery(lastSearch);
  }, [getLastActivity]);

  const handleTabChange = useCallback(
    (tabId: string) => {
      setActiveTab(tabId);
      recordActivity("tab_selected", { tabId });
    },
    [recordActivity],
  );

  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const query = e.target.value;
      setSearchQuery(query);
      recordActivity("search_performed", { searchQuery: query });
    },
    [recordActivity],
  );

  const handleClose = useCallback(() => {
    handleDrawerChange(false);
  }, []);

  return (
    <Drawer open={open} onOpenChange={handleDrawerChange}>
      <DrawerTrigger asChild>
        <Button variant="ghost" size="icon" className="text-primary">
          <Settings className="h-5 w-5" />
          <span className="sr-only">{t("settings")}</span>
        </Button>
      </DrawerTrigger>

      <DrawerContent>
        <div className="mx-auto w-full max-w-md">
          <DrawerHeader>
            <DrawerTitle>{t("applicationSettings")}</DrawerTitle>
            <DrawerDescription>{t("customizePreferences")}</DrawerDescription>
          </DrawerHeader>

          <Tabs
            value={activeTab}
            onValueChange={handleTabChange}
            className="px-4"
          >
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="themes">
                <Star className="h-4 w-4 mr-2" />
                {t("allThemes")}
              </TabsTrigger>
              <TabsTrigger value="fonts">
                <Type className="h-4 w-4 mr-2" />
                {t("allFonts")}
              </TabsTrigger>
              <TabsTrigger value="language">
                <Languages className="h-4 w-4 mr-2" />
                {t("language")}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="themes" className="mt-4">
              <ThemeTab
                searchQuery={searchQuery}
                onSearchChange={handleSearchChange}
              />
            </TabsContent>

            <TabsContent value="fonts" className="mt-4">
              <FontTab
                searchQuery={searchQuery}
                onSearchChange={handleSearchChange}
              />
            </TabsContent>

            <TabsContent value="language" className="mt-4">
              <LanguageTab />
            </TabsContent>
          </Tabs>

          <DrawerFooter>
            <Button onClick={handleClose}>{t("close")}</Button>
          </DrawerFooter>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
