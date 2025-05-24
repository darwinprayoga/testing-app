"use client";

import { useState, useEffect } from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProfileDrawer } from "@/components/profile/profile-drawer";
import { PwaDrawer } from "@/components/pwa-drawer";
import { ShareDrawer } from "@/components/share-drawer";
import { useMediaQuery } from "@/hooks/use-media-query";
import { ClipboardIcon, ListTodo, RefreshCcw } from "lucide-react";
import { SettingsDrawer } from "@/components/settings/settings-drawer";
import { useLanguage } from "@/contexts/language-context";
import Image from "next/image";
import { InfoDrawer } from "@/components/info-drawer";
import { LoadingScreen } from "@/components/loading-screen";
import { useStorage } from "@/contexts/storage-context";
import { CookieExpirationToast } from "@/components/cookie-expiration-toast";
import dynamic from "next/dynamic";
import { cloudUtils } from "@/utils/storage-utils";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";

const Clipboard = dynamic(() => import("@/components/clipboard/clipboard"), {
  ssr: false, // Optional: disables SSR
});

const Todo = dynamic(() => import("@/components/todo/todo"), {
  ssr: false, // Optional: disables SSR
});

export default function Home() {
  const { getItem, setItem, isStorageReady } = useStorage();
  const [activeTab, setActiveTab] = useState<string>("clipboard");
  const [infoDrawerOpen, setInfoDrawerOpen] = useState(false);
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const { t } = useLanguage();
  const { thisUser, isCloud } = useAuth();

  type SettingKey = "activeTab" | "infoDrawerOpen";

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

  // Keys and their setters for loading
  const settingLoaders: Record<SettingKey, (val: any) => void> = {
    activeTab: (val) => setActiveTab(val ?? "clipboard"),
    infoDrawerOpen: setInfoDrawerOpen,
  };

  // Load settings on mount or dependency change
  useEffect(() => {
    Object.entries(settingLoaders).forEach(([key, setter]) => {
      loadSetting(key as SettingKey, setter);
    });
  }, [isStorageReady, getItem, thisUser, isCloud]);

  // Save infoDrawerOpen on change
  useEffect(() => {
    updateSetting("infoDrawerOpen", infoDrawerOpen, setInfoDrawerOpen);
  }, [infoDrawerOpen, isStorageReady]);

  const [isLoading, setIsLoading] = useState(true);

  // Show loading screen on initial load
  useEffect(() => {
    // Show loading screen for 1 second
    const timer = setTimeout(() => {
      !isStorageReady && setIsLoading(false);
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  // Update the handleTabChange function:
  const handleTabChange = (value: string) => {
    updateSetting("activeTab", value, setActiveTab);

    if (!isStorageReady) return;
    setItem("activeTab", value);
  };

  // Render storage and load
  const [hasCheckedStorage, setHasCheckedStorage] = useState(false);
  const [readyToRender, setReadyToRender] = useState(false);

  useEffect(() => {
    // Only runs on the client
    if (!isStorageReady) {
      const hasReloaded = sessionStorage.getItem("hasReloadedForStorage");

      if (!hasReloaded) {
        sessionStorage.setItem("hasReloadedForStorage", "true");
        location.reload();
      }
    } else {
      setReadyToRender(true);
    }

    setHasCheckedStorage(true);
  }, [isStorageReady]);

  if (!hasCheckedStorage || !readyToRender) {
    return null;
  }

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
          onClick={() =>
            updateSetting("infoDrawerOpen", true, setInfoDrawerOpen)
          }
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
        <div className="flex items-center gap-1">
          <Button
            onClick={() => location.reload()}
            title="Refresh"
            variant="ghost"
            size="icon"
            className="text-primary"
          >
            <RefreshCcw className="h-5 w-5" />
          </Button>
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
