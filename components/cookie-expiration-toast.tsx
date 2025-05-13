"use client";

import { useEffect, useRef } from "react";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/language-context";
import { localUtils, useStorage } from "@/contexts/storage-context";
import { formatDistanceToNow } from "date-fns";
import { useActivity } from "@/contexts/activity-context";

export function CookieExpirationToast() {
  const { toast, dismiss } = useToast();
  const { t } = useLanguage();
  const { storageType, isStorageReady, setItem } = useStorage();
  const { recordActivity } = useActivity();

  const hasDisplayedToast = useRef(false);

  const getExpirationTime = (): string => {
    try {
      const rawExpiry = localUtils.get("dataStorageExpires");

      return formatDistanceToNow(rawExpiry, { addSuffix: false });
    } catch (error) {
      console.error("Failed to read cookie expiration:", error);
      return "unknown";
    }
  };

  const persistSetting = (key: string, value: any) => {
    if (isStorageReady) setItem(key, value);
  };

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
      toast({
        title: t("cookieStorageTitle"),
        description: t("cookieStorageDesc")?.replace("{time}", expiration),
        duration: 5000,
        action: (
          <div className="flex gap-2 mt-2">
            <Button
              size="sm"
              onClick={() => {
                persistSetting("profileDrawerOpen", true);

                recordActivity("tab_selected", { tabId: "data" });

                location.reload();
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
