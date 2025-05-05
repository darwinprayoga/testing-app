"use client";

import type React from "react";

import { useState, useEffect, useRef } from "react";
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

export function SettingsDrawer() {
  const [open, setOpen] = useState(false);
  const { getItem, setItem, isStorageReady } = useStorage();

  // Load drawer state from localStorage on mount
  useEffect(() => {
    const loadDrawerState = async () => {
      if (!isStorageReady) return;

      try {
        const savedState = await getItem("settingsDrawerOpen");
        if (savedState) {
          setOpen(savedState === "true");
        }
      } catch (error) {
        console.error("Error loading drawer state:", error);
      }
    };

    loadDrawerState();
  }, [isStorageReady, getItem]);

  // Save drawer state to localStorage when it changes
  useEffect(() => {
    if (isStorageReady) {
      setItem("settingsDrawerOpen", open.toString());
    }
  }, [open, isStorageReady, setItem]);

  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("themes");

  const { t } = useLanguage();
  const { recordActivity, getLastActivity } = useActivity();

  // First, add a ref to track initialization
  const initializedRef = useRef(false);

  // Restore user context on mount
  useEffect(() => {
    if (!initializedRef.current) {
      initializedRef.current = true;
      const lastTabSelected = getLastActivity("tab_selected");
      const lastSearchPerformed = getLastActivity("search_performed");

      if (lastTabSelected && lastTabSelected.details?.tabId) {
        const tabId = lastTabSelected.details.tabId;
        if (tabId === "themes" || tabId === "fonts" || tabId === "language") {
          setActiveTab(tabId);
        }
      }

      if (lastSearchPerformed && lastSearchPerformed.details?.searchQuery) {
        setSearchQuery(lastSearchPerformed.details.searchQuery);
      }
    }
  }, [getLastActivity]);

  useEffect(() => {
    if (isStorageReady) {
      setItem("settingsSearchQuery", searchQuery);
    }
  }, [searchQuery, isStorageReady, setItem]);

  // Record activity when settings dialog is opened
  useEffect(() => {
    if (open && initializedRef.current) {
      recordActivity("settings_opened");
    }
  }, [open, recordActivity]);

  // Record activity when tab is changed
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    recordActivity("tab_selected", { tabId: value });
  };

  // Record activity when search is performed
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    recordActivity("search_performed", { searchQuery: query });
  };

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>
        <Button variant="ghost" size="icon" className="text-primary">
          <Settings className="h-5 w-5" />
          <span className="sr-only">Settings</span>
        </Button>
      </DrawerTrigger>
      <DrawerContent>
        <div className="mx-auto w-full max-w-md">
          <DrawerHeader>
            <DrawerTitle>{t("applicationSettings")}</DrawerTitle>
            <DrawerDescription>{t("customizePreferences")}</DrawerDescription>
          </DrawerHeader>

          <Tabs
            defaultValue={activeTab}
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
                Fonts
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
            <Button onClick={() => setOpen(false)}>Close</Button>
          </DrawerFooter>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
