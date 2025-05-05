"use client";

import { useEffect } from "react";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/language-context";
import { useStorage } from "@/contexts/storage-context";
import { formatDistanceToNow } from "date-fns";

export function CookieExpirationToast() {
  const { toast, dismiss } = useToast();
  const { t } = useLanguage();
  const { storageType, isStorageReady, setItem } = useStorage();

  const getCookieExpirationText = () => {
    const expirationDate = new Date();
    expirationDate.setTime(expirationDate.getTime() + 3 * 24 * 60 * 60 * 1000);
    return formatDistanceToNow(expirationDate, { addSuffix: false });
  };

  useEffect(() => {
    if (!isStorageReady) return;
    const toastKey = "cookie-toast-shown";

    if (storageType === "cookies" && !sessionStorage.getItem(toastKey)) {
      const id: any = toast({
        title: t("cookieStorageTitle"),
        description: t("cookieStorageDesc").replace(
          "{time}",
          getCookieExpirationText(),
        ),
        duration: 5000,
        action: (
          <div className="flex gap-2 mt-2">
            <Button
              size="sm"
              onClick={() => {
                dismiss(id);
                setItem("profileDrawerOpen", "true");
                setItem("profileActiveTab", "data");
              }}
            >
              {t("settings")}
            </Button>
          </div>
        ),
      });

      sessionStorage.setItem(toastKey, "true");
    }
  }, [isStorageReady, storageType, toast, dismiss, t, setItem]);

  return null;
}
