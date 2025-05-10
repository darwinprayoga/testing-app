"use client";

import { useEffect, useRef } from "react";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/language-context";
import { useStorage } from "@/contexts/storage-context";
import { formatDistanceToNow } from "date-fns";
import { useDebouncedCallback } from "use-debounce";

export function CookieExpirationToast() {
  const { toast, dismiss } = useToast();
  const { t } = useLanguage();
  const { storageType, isStorageReady, setItem } = useStorage();

  const hasDisplayedToast = useRef(false);

  const safeGetLocalStorageItem = (key: string): string | null => {
    try {
      return typeof window !== "undefined" && window.localStorage
        ? window.localStorage.getItem(key)
        : null;
    } catch {
      return null;
    }
  };

  const getExpirationTime = (): string => {
    try {
      const rawExpiry = safeGetLocalStorageItem("dataStorageExpires");
      console.log("Raw expiry value:", rawExpiry);
      if (!rawExpiry) return "unknown";

      const decoded = decodeURIComponent(rawExpiry);
      console.log("Decoded expiry:", decoded);

      const expiryDate = new Date(decoded);
      console.log("Parsed expiry date:", expiryDate.toISOString());

      return isNaN(expiryDate.getTime())
        ? "unknown"
        : formatDistanceToNow(expiryDate, { addSuffix: false });
    } catch (error) {
      console.error("Failed to read cookie expiration:", error);
      return "unknown";
    }
  };

  const persistSetting = useDebouncedCallback(
    (key: string, value: any) => {
      if (isStorageReady) setItem(key, value);
    },
    300,
    { maxWait: 1000 },
  );

  useEffect(() => {
    if (
      !isStorageReady ||
      hasDisplayedToast.current ||
      storageType !== "cookies"
    )
      return;

    hasDisplayedToast.current = true;

    const expiration = getExpirationTime();

    setTimeout(() => {
      const toastId: any = toast({
        title: t("cookieStorageTitle"),
        description: t("cookieStorageDesc")?.replace("{time}", expiration),
        duration: 5000,
        action: (
          <div className="flex gap-2 mt-2">
            <Button
              size="sm"
              onClick={() => {
                dismiss(toastId);
                persistSetting("profileDrawerOpen", true);
                persistSetting("profileActiveTab", "data");
              }}
            >
              {t("settings")}
            </Button>
          </div>
        ),
      });
    }, 3000);
  }, [isStorageReady, storageType, toast, dismiss, t, persistSetting]);

  return null;
}
