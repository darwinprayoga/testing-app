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
import { useStorage } from "@/contexts/storage-context";
import { formatDistanceToNow } from "date-fns";
import { ProfileTab } from "./profile-tab";
import { DataStorageTab } from "./data-storage-tab";
import { ResetDataDialog } from "./reset-data-dialog";
import type { User } from "./types";
import { useAuth } from "@/contexts/auth-context";
import { cloudUtils, localUtils } from "@/utils/storage-utils";
import { useActivity } from "@/contexts/activity-context";

const DEFAULT_USER: User = {
  username: "",
  uid: "",
  email: "",
  image: "",
  hasPremium: false,
};

type UserKey = "isDrawerOpen" | "datas";

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
  const { thisUser, signOut, signInWithGoogle } = useAuth();

  const loadUser = async (key: UserKey, setter: (val: any) => void) => {
    try {
      if (thisUser) {
        const userProfile = await cloudUtils.get("userProfile", thisUser.id);
        const value = userProfile?.[0]?.[key];
        if (value !== undefined) setter(value);
      } else if (isStorageReady) {
        const value = await getItem(key);
        if (value !== undefined) setter(value);
      }
    } catch (error) {
      console.error(`Failed to load setting "${key}":`, error);
    }
  };

  const updateUser = async (
    key: UserKey,
    value: any,
    setter: (val: any) => void,
  ) => {
    try {
      if (thisUser) {
        await cloudUtils.set(
          "userProfile",
          { uid: thisUser.id, [key]: value },
          thisUser.id,
        );
      }
      setter(value);
    } catch (error) {
      console.error(`Failed to update setting "${key}":`, error);
    }
  };

  // User-specific setters
  const userLoaders: Record<UserKey, (val: any) => void> = {
    isDrawerOpen: (val) => setIsDrawerOpen(val ?? false),
    datas: (val) => setUser(val ?? DEFAULT_USER),
  };

  // Load user data when dependencies change
  useEffect(() => {
    Object.entries(userLoaders).forEach(([key, setter]) => {
      loadUser(key as UserKey, setter);
    });
  }, [isStorageReady, getItem, thisUser]);

  const getExpirationTime = (): string => {
    try {
      const rawExpiry = localUtils.get("dataStorageExpires");

      return formatDistanceToNow(rawExpiry, { addSuffix: false });
    } catch (error) {
      console.error("Failed to read cookie expiration:", error);
      return "unknown";
    }
  };

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

  const handleSubmit = async () => {
    const value = user.username.trim();
    const usernameRegex = /^[a-zA-Z0-9._]{3,30}$/;

    // Validate empty
    if (!value) {
      setUsernameError(t("usernameRequired"));
      return;
    }

    // Validate pattern
    if (!usernameRegex.test(value)) {
      setUsernameError(t("usernameInvalid"));
      return;
    }

    // Check availability
    const result = await cloudUtils.query("userProfile", { username: value });
    const isTaken =
      result[0]?.username === value && result[0]?.uid !== thisUser?.id;

    if (isTaken) {
      setUsernameError(t("usernameAlreadyTaken"));
      return;
    }

    // Final safety check
    if (thisUser && !usernameError) {
      await cloudUtils.set(
        "userProfile",
        { uid: thisUser.id, username: value, datas: user },
        thisUser.id,
      );
      location.reload();
    }
  };

  const handleDrawerOpenChange = (open: boolean) => {
    updateUser("isDrawerOpen", open, setIsDrawerOpen);
  };

  const updateProfile = useCallback(
    (field: keyof User, value: string | boolean) => {
      setUser((prev) => ({ ...prev, [field]: value }));
    },
    [],
  );

  const handleLogout = () => {
    setUser(DEFAULT_USER);
    setStorageType("cookies");
    setIsDrawerOpen(false);
    signOut();
  };

  const getStorageTypeValue = (): string => {
    if (storageType === "cookies") return "cookies";
    if (storageType === "localStorage" && user.hasPremium) return "cloud";
    if (storageType === "localStorage") return "localStorage";
    return "";
  };

  const storageValue = getStorageTypeValue();

  const togglePremium = async () => {
    if (!user.uid) {
      return toast({
        title: t("loginRequired"),
        description: t("loginBeforeSubscribing"),
        variant: "destructive",
      });
    }

    const newPremium = !user.hasPremium;

    // Add confirmation before enabling premium
    if (newPremium) {
      const confirmed = confirm(t("confirmPremiumMessage"));

      if (!confirmed) return; // User clicked Cancel
    }

    try {
      await cloudUtils.set(
        "userProfile",
        {
          uid: user.uid,
          hasPremium: newPremium,
          storageType: newPremium ? "cloud" : "localStorage",
          datas: { ...user, hasPremium: newPremium },
        },
        user.uid,
      );

      toast({
        title: newPremium ? t("premiumActivated") : t("premiumCancelled"),
        description: newPremium
          ? t("premiumActivatedDesc")
          : t("premiumCancelledDesc"),
      });

      if (!newPremium) setStorageType("localStorage");

      setTimeout(() => {
        handleTabChange("data");
        location.reload();
      }, 1000);
    } catch (error) {
      toast({
        title: t("error"),
        description: t("somethingWentWrong"),
        variant: "destructive",
      });
      console.error("Failed to toggle premium:", error);
    }
  };

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    recordActivity("tab_selected", { tabId: tab });
  };

  const handleResetData = () => {
    clearAll();
    if (user.uid) setItem("userProfile", user);
    setResetDialogOpen(false);
    toast({
      title: t("dataResetComplete"),
      description: t("dataResetCompleteDesc"),
    });
    location.reload();
  };

  return (
    <Drawer open={isDrawerOpen} onOpenChange={handleDrawerOpenChange}>
      <DrawerTrigger asChild>
        <Button variant="ghost" size="icon" className="rounded-full">
          <Avatar>
            {user.uid ? (
              <>
                <AvatarImage src={user.image} />
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
              {user.uid ? t("yourProfile") : t("signIn")}
            </DrawerTitle>
            <DrawerDescription>
              {user.uid ? t("updateProfile") : t("signInDesc")}
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
                handleGoogleLogin={signInWithGoogle}
                togglePremium={togglePremium}
                usernameError={usernameError}
                setUsernameError={setUsernameError}
              />
            </TabsContent>

            <TabsContent value="data" className="mt-4">
              <DataStorageTab
                storageType={storageValue}
                openResetDialog={() => setResetDialogOpen(true)}
                getCookieExpirationText={getExpirationTime}
              />
            </TabsContent>
          </Tabs>

          <DrawerFooter>
            {user.uid && activeTab === "profile" ? (
              <>
                <Button
                  disabled={usernameError != null}
                  onClick={handleSubmit}
                  type="submit"
                >
                  {t("saveChanges")}
                </Button>
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
