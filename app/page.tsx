"use client";

import { useState, useEffect, useRef } from "react";
import { Clipboard } from "@/components/clipboard/clipboard";
import { Todo } from "@/components/todo/todo";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProfileDrawer } from "@/components/profile/profile-drawer";
import { PwaDrawer } from "@/components/pwa-drawer";
import { ShareDrawer } from "@/components/share-drawer";
import { useMediaQuery } from "@/hooks/use-media-query";
import { ClipboardIcon, ListTodo } from "lucide-react";
import { SettingsDrawer } from "@/components/settings/settings-drawer";
import { useLanguage } from "@/contexts/language-context";
import { useActivity } from "@/contexts/activity-context";
import Image from "next/image";
import { InfoDrawer } from "@/components/info-drawer";
import { LoadingScreen } from "@/components/loading-screen";
import { useStorage } from "@/contexts/storage-context";
import { CookieExpirationToast } from "@/components/cookie-expiration-toast";

export default function Home() {
  const { getItem, setItem, isStorageReady } = useStorage();
  const [activeTab, setActiveTab] = useState<string>("clipboard");
  const [infoDrawerOpen, setInfoDrawerOpen] = useState(false);

  const isDesktop = useMediaQuery("(min-width: 768px)");
  const { t } = useLanguage();
  const { recordActivity, getLastActivity } = useActivity();

  // Load active tab from storage
  useEffect(() => {
    const loadTab = async () => {
      if (isStorageReady) {
        const savedTab = await getItem("activeTab");
        if (savedTab) {
          setActiveTab(savedTab);
        }
      }
    };
    loadTab();
  }, [isStorageReady, getItem]);

  // Save activeTab to storage whenever it changes
  useEffect(() => {
    if (isStorageReady) {
      setItem("activeTab", activeTab);
    }
  }, [activeTab, isStorageReady, setItem]);

  // Load info drawer state from storage
  useEffect(() => {
    const loadDrawer = async () => {
      if (isStorageReady) {
        const savedState = await getItem("infoDrawerOpen");
        if (savedState) {
          setInfoDrawerOpen(savedState === "true");
        }
      }
    };
    loadDrawer();
  }, [isStorageReady, getItem]);

  // Save info drawer state to storage
  useEffect(() => {
    if (isStorageReady) {
      setItem("infoDrawerOpen", String(infoDrawerOpen));
    }
  }, [infoDrawerOpen, isStorageReady, setItem]);

  const [isLoading, setIsLoading] = useState(true);

  // Add a ref to track initialization
  const initializedRef = useRef(false);

  // Show loading screen on initial load
  useEffect(() => {
    // Show loading screen for 1 second
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  // Restore user context on mount
  useEffect(() => {
    // Only run once on mount
    if (!initializedRef.current && isStorageReady) {
      initializedRef.current = true;

      // Check if there's a previous activity to restore
      const lastTabActivity = getLastActivity("tab_selected");

      if (lastTabActivity && lastTabActivity.details?.tabId) {
        // Only restore if it's a main tab (clipboard or todo)
        const tabId = lastTabActivity.details.tabId;
        if (tabId === "clipboard" || tabId === "todo") {
          setActiveTab(tabId);
        }
      }
    }
  }, [getLastActivity, isStorageReady]);

  // Update the handleTabChange function:
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    if (isStorageReady) {
      setItem("activeTab", value);
    }
    recordActivity("tab_selected", { tabId: value });
  };

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <main className="flex min-h-screen flex-col items-center p-4 md:p-8">
      {/* Cookie expiration toast component */}
      <CookieExpirationToast />

      {/* Top navigation bar */}
      <div className="w-full max-w-2xl flex justify-between items-center mb-6">
        <div
          className="flex items-center gap-2 cursor-pointer group"
          onClick={() => setInfoDrawerOpen(true)}
        >
          <Image
            src="/logo.svg"
            alt="Clipbored Logo"
            width={180}
            height={28}
            className="logo-image"
          />
          <div className="flex items-center justify-center px-2 py-0.5 rounded-full border border-primary bg-primary/10">
            <span className="text-xs font-semibold text-primary">BETA</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <SettingsDrawer />
          <ProfileDrawer />
        </div>
      </div>

      <div className="w-full max-w-2xl flex flex-col gap-6">
        {isDesktop ? (
          <div className="w-full flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <Tabs
                value={activeTab}
                defaultValue={activeTab}
                className="w-full"
                onValueChange={handleTabChange}
              >
                <TabsList className="grid grid-cols-2 bg-muted">
                  <TabsTrigger
                    value="clipboard"
                    className="data-[state=active]:bg-background data-[state=active]:text-[var(--main-color)]"
                  >
                    <ClipboardIcon className="h-4 w-4 mr-2" />
                    {t("clipboard")}
                  </TabsTrigger>
                  <TabsTrigger
                    value="todo"
                    className="data-[state=active]:bg-background data-[state=active]:text-[var(--main-color)]"
                  >
                    <ListTodo className="h-4 w-4 mr-2" />
                    {t("todo")}
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
            {activeTab === "clipboard" ? <Clipboard /> : <Todo />}
          </div>
        ) : (
          <div className="w-full">
            <div className="flex justify-between items-center mb-4">
              <Tabs
                value={activeTab}
                defaultValue={activeTab}
                className="w-full"
                onValueChange={handleTabChange}
              >
                <TabsList className="grid grid-cols-2 bg-muted">
                  <TabsTrigger
                    value="clipboard"
                    className="data-[state=active]:bg-background data-[state=active]:text-[var(--main-color)]"
                  >
                    <ClipboardIcon className="h-4 w-4 mr-2" />
                    {t("clipboard")}
                  </TabsTrigger>
                  <TabsTrigger
                    value="todo"
                    className="data-[state=active]:bg-background data-[state=active]:text-[var(--main-color)]"
                  >
                    <ListTodo className="h-4 w-4 mr-2" />
                    {t("todo")}
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
            {activeTab === "clipboard" ? <Clipboard /> : <Todo />}
          </div>
        )}
      </div>
      <div className="fixed bottom-4 left-4 flex gap-2">
        <PwaDrawer />
      </div>
      <div className="fixed bottom-4 right-4">
        <ShareDrawer />
      </div>
      <InfoDrawer open={infoDrawerOpen} onOpenChange={setInfoDrawerOpen} />
    </main>
  );
}
