"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { LogOut } from "lucide-react";
import { useLanguage } from "@/contexts/language-context";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/use-toast";
import { useStorage, type StorageType } from "@/contexts/storage-context";
import { formatDistanceToNow } from "date-fns";
import { ProfileTab } from "./profile-tab";
import { DataStorageTab } from "./data-storage-tab";
import { ResetDataDialog } from "./reset-data-dialog";
import type { User } from "./types";
import { useActivity } from "@/contexts/activity-context";

const DEFAULT_USER: User = {
  username: "",
  email: "",
  image: "",
  isLoggedIn: false,
  hasPremium: false,
};

export function ProfileDrawer() {
  const [user, setUser] = useState<User>(DEFAULT_USER);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("profile");
  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  const [usernameError, setUsernameError] = useState<string | null>(null);

  const { toast } = useToast();
  const { t } = useLanguage();
  const {
    storageType,
    setStorageType,
    getItem,
    setItem,
    clearAll,
    isStorageReady,
  } = useStorage();
  const { recordActivity, getLastActivity } = useActivity();
  const initializedRef = useRef(false);

  // Load profile data from storage on init
  useEffect(() => {
    const loadFromStorage = async () => {
      if (!isStorageReady) return;
      try {
        const [savedUser, savedDrawerOpen] = await Promise.all([
          getItem("userProfile"),
          getItem("profileDrawerOpen"),
          getItem("profileActiveTab"),
        ]);

        if (savedUser) setUser(savedUser);
        if (savedDrawerOpen) setIsDrawerOpen(savedDrawerOpen);
      } catch (err) {
        console.error("Failed to load profile drawer data:", err);
      }
    };

    loadFromStorage();
  }, [isStorageReady, getItem]);

  // Restore user context on mount
  useEffect(() => {
    if (!initializedRef.current) {
      initializedRef.current = true;
      const lastTabSelected = getLastActivity("tab_selected");

      if (lastTabSelected && lastTabSelected.details?.tabId) {
        const tabId = lastTabSelected.details.tabId;
        if (tabId === "profile" || tabId === "data") {
          setActiveTab(tabId);
        }
      }
    }
  }, [getLastActivity]);

  // Persist data to storage
  useEffect(() => {
    if (isStorageReady) setItem("userProfile", user);
  }, [user, isStorageReady, setItem]);

  useEffect(() => {
    if (isStorageReady) setItem("profileDrawerOpen", isDrawerOpen);
  }, [isDrawerOpen, isStorageReady, setItem]);

  const handleDrawerOpenChange = (open: boolean) => setIsDrawerOpen(open);

  const updateProfile = useCallback(
    (field: keyof User, value: string | boolean) => {
      setUser((prev) => ({ ...prev, [field]: value }));
    },
    [],
  );

  const handleGoogleLogin = () =>
    setUser({
      username: "johndoe",
      email: "john.doe@example.com",
      image: "",
      isLoggedIn: true,
      hasPremium: false,
    });

  const handleLogout = () => {
    setUser(DEFAULT_USER);
    setStorageType("cookies");
    setIsDrawerOpen(false);
  };

  const handleDataStorageChange = (value: StorageType) => {
    setStorageType(value);
  };

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    recordActivity("tab_selected", { tabId: tab });
  };

  const getCookieExpirationText = () => {
    const expirationDate = new Date();
    expirationDate.setTime(expirationDate.getTime() + 3 * 24 * 60 * 60 * 1000);
    return formatDistanceToNow(expirationDate);
  };

  const handleResetData = () => {
    clearAll();
    if (user.isLoggedIn) setItem("userProfile", user);
    setResetDialogOpen(false);
    toast({
      title: t("dataResetComplete"),
      description: t("dataResetCompleteDesc"),
    });
    window.location.reload();
  };

  const togglePremium = () => {
    if (!user.isLoggedIn) {
      toast({
        title: t("loginRequired"),
        description: t("loginBeforeSubscribing"),
        variant: "destructive",
      });
      return;
    }

    const newPremium = !user.hasPremium;
    updateProfile("hasPremium", newPremium);

    toast({
      title: newPremium ? t("premiumActivated") : t("premiumCancelled"),
      description: newPremium
        ? t("premiumActivatedDesc")
        : t("premiumCancelledDesc"),
    });

    if (!newPremium && storageType === "cloud") {
      setStorageType("localStorage");
    }

    if (newPremium) {
      setActiveTab("data");
      setTimeout(() => {
        toast({
          title: t("cloudStorageAvailable"),
          description: t("cloudStorageAvailableDesc"),
          action: (
            <Button
              size="sm"
              variant="outline"
              onClick={() => setStorageType("cloud")}
            >
              {t("switchToCloud")}
            </Button>
          ),
        });
      }, 1000);
    }
  };

  return (
    <Drawer open={isDrawerOpen} onOpenChange={handleDrawerOpenChange}>
      <DrawerTrigger asChild>
        <Button variant="ghost" size="icon" className="rounded-full">
          <Avatar>
            {user.isLoggedIn ? (
              <>
                <AvatarImage src={user.image || ""} />
                <AvatarFallback className="bg-primary text-white">
                  {user.username
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </AvatarFallback>
              </>
            ) : (
              <AvatarFallback className="bg-muted text-muted-foreground">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              </AvatarFallback>
            )}
          </Avatar>
        </Button>
      </DrawerTrigger>

      <DrawerContent>
        <div className="mx-auto w-full max-w-sm">
          <DrawerHeader>
            <DrawerTitle>
              {user.isLoggedIn ? t("yourProfile") : t("signIn")}
            </DrawerTitle>
            <DrawerDescription>
              {user.isLoggedIn ? t("updateProfile") : t("signInDesc")}
            </DrawerDescription>
          </DrawerHeader>

          <Tabs
            value={activeTab}
            onValueChange={handleTabChange}
            className="px-4"
          >
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="profile">{t("profile")}</TabsTrigger>
              <TabsTrigger value="data">{t("dataStorage")}</TabsTrigger>
            </TabsList>

            <TabsContent value="profile" className="mt-4">
              <ProfileTab
                user={user}
                updateProfile={updateProfile}
                handleGoogleLogin={handleGoogleLogin}
                togglePremium={togglePremium}
                usernameError={usernameError}
                setUsernameError={setUsernameError}
              />
            </TabsContent>

            <TabsContent value="data" className="mt-4">
              <DataStorageTab
                user={user}
                storageType={storageType}
                handleDataStorageChange={handleDataStorageChange}
                openResetDialog={() => setResetDialogOpen(true)}
                getCookieExpirationText={getCookieExpirationText}
              />
            </TabsContent>
          </Tabs>

          <DrawerFooter>
            {user.isLoggedIn ? (
              <>
                <Button type="submit">{t("saveChanges")}</Button>
                <Button
                  variant="outline"
                  onClick={handleLogout}
                  className="gap-2"
                >
                  <LogOut className="h-4 w-4" />
                  {t("signOut")}
                </Button>
              </>
            ) : (
              <DrawerClose asChild>
                <Button variant="outline">{t("cancel")}</Button>
              </DrawerClose>
            )}
          </DrawerFooter>
        </div>
      </DrawerContent>

      <ResetDataDialog
        open={resetDialogOpen}
        onOpenChange={setResetDialogOpen}
        onReset={handleResetData}
      />
    </Drawer>
  );
}
