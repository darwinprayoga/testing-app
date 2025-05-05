"use client";

import { useState, useEffect } from "react";
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

export function ProfileDrawer() {
  const [user, setUser] = useState<User>({
    username: "",
    email: "",
    image: "",
    isLoggedIn: false,
    hasPremium: false,
  });

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("profile");
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

  useEffect(() => {
    const loadDataFromStorage = async () => {
      if (!isStorageReady) return;

      try {
        // Load user profile
        const savedUser = await getItem("userProfile");
        if (savedUser) {
          try {
            setUser(savedUser);
          } catch (error) {
            console.error("Error parsing user profile:", error);
          }
        }

        // Load profile drawer state
        const savedDrawerState = await getItem("profileDrawerOpen");
        if (savedDrawerState) {
          setIsDrawerOpen(savedDrawerState === "true");
        }

        // Load active tab state
        const savedActiveTab = await getItem("profileActiveTab");
        if (savedActiveTab) {
          setActiveTab(savedActiveTab);
        }
      } catch (error) {
        console.error("Error during loading data from storage:", error);
      }
    };

    loadDataFromStorage();
  }, [isStorageReady, getItem]);

  // Save user profile to storage when it changes
  useEffect(() => {
    if (isStorageReady) {
      setItem("userProfile", user);
    }
  }, [user, isStorageReady, setItem]);

  // Save drawer state to storage when it changes
  useEffect(() => {
    if (isStorageReady) {
      setItem("profileDrawerOpen", isDrawerOpen.toString());
    }
  }, [isDrawerOpen, isStorageReady, setItem]);

  // Save active tab to storage when it changes
  useEffect(() => {
    if (isStorageReady) {
      setItem("profileActiveTab", activeTab);
    }
  }, [activeTab, isStorageReady, setItem]);

  const handleDrawerOpenChange = (open: boolean) => {
    setIsDrawerOpen(open);
    if (isStorageReady) {
      setItem("profileDrawerOpen", open.toString());
    }
  };

  const handleGoogleLogin = () => {
    // Simulate Google login
    setUser({
      username: "johndoe",
      email: "john.doe@example.com",
      image: "",
      isLoggedIn: true,
      hasPremium: false,
    });
  };

  const handleLogout = () => {
    setUser({
      username: "",
      email: "",
      image: "",
      isLoggedIn: false,
      hasPremium: false,
    });

    // Reset data storage to cookies when logging out
    setStorageType("cookies");

    setIsDrawerOpen(false);
  };

  const updateProfile = (field: keyof User, value: string | boolean) => {
    setUser((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleDataStorageChange = (value: StorageType) => {
    // // Check if user is logged in for localStorage option
    // if (value === "localStorage" && !user.isLoggedIn) {
    //   toast({
    //     title: t("loginRequired"),
    //     description: t("loginRequiredDesc"),
    //     variant: "destructive",
    //   });
    //   return;
    // }

    // // Check if user is logged in and has premium for cloud option
    // if (value === "cloud" && (!user.isLoggedIn || !user.hasPremium)) {
    //   toast({
    //     title: t("premiumRequired"),
    //     description: t("premiumRequiredDesc"),
    //     variant: "destructive",
    //   });
    //   return;
    // }

    // Change the storage type - migration happens in the storage context
    setStorageType(value);
  };

  // Calculate cookie expiration time (3 days from now)
  const getCookieExpirationText = () => {
    const expirationDate = new Date();
    expirationDate.setTime(expirationDate.getTime() + 3 * 24 * 60 * 60 * 1000);
    return formatDistanceToNow(expirationDate, { addSuffix: false });
  };

  const handleResetData = () => {
    // Clear all data
    clearAll();

    // Preserve user profile if logged in
    if (user.isLoggedIn) {
      setItem("userProfile", user);
    }

    // Close the dialog
    setResetDialogOpen(false);

    // Show success toast
    toast({
      title: t("dataResetComplete"),
      description: t("dataResetCompleteDesc"),
    });

    // Reload the page to reset the app state
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

    // Toggle premium status
    const newPremiumStatus = !user.hasPremium;

    // Update user profile with new premium status
    updateProfile("hasPremium", newPremiumStatus);

    // Show toast notification
    toast({
      title: newPremiumStatus ? t("premiumActivated") : t("premiumCancelled"),
      description: newPremiumStatus
        ? t("premiumActivatedDesc")
        : t("premiumCancelledDesc"),
    });

    // If user cancels premium and was using cloud storage, switch to localStorage
    if (!newPremiumStatus && storageType === "cloud") {
      setStorageType("localStorage");
    }

    // If user upgrades to premium, automatically switch to the data tab
    if (newPremiumStatus) {
      setActiveTab("data");

      // Show a toast suggesting to try cloud storage
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
          {user.isLoggedIn ? (
            <Avatar>
              <AvatarImage src={user.image || ""} />
              <AvatarFallback className="bg-primary text-white">
                {user.username
                  .split(" ")
                  .map((n) => n[0])
                  .join("")}
              </AvatarFallback>
            </Avatar>
          ) : (
            <Avatar>
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
                  className="lucide lucide-user"
                >
                  <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              </AvatarFallback>
            </Avatar>
          )}
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
            defaultValue={activeTab}
            value={activeTab}
            onValueChange={setActiveTab}
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

      {/* Reset Data Confirmation Dialog */}
      <ResetDataDialog
        open={resetDialogOpen}
        onOpenChange={setResetDialogOpen}
        onReset={handleResetData}
      />
    </Drawer>
  );
}
