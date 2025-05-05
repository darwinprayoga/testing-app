"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useLanguage } from "@/contexts/language-context";
import { Cloud, Cookie, HardDrive, Info, Clock } from "lucide-react";
import type { DataStorageTabProps } from "./types";

export function DataStorageTab({
  user,
  storageType,
  handleDataStorageChange,
  openResetDialog,
  getCookieExpirationText,
}: DataStorageTabProps) {
  const { t } = useLanguage();

  const getStorageDisplayName = (storage: string) => {
    switch (storage) {
      case "cookies":
        return t("cookiesStorage");
      case "localStorage":
        return t("localStorage");
      case "cloud":
        return t("cloudStorage");
      default:
        return t("unknownStorage");
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-medium mb-2">{t("dataStorageOptions")}</h3>
        <p className="text-sm text-muted-foreground mb-4">
          {t("dataStorageOptionsDesc")}
        </p>
      </div>

      <RadioGroup value={storageType} onValueChange={handleDataStorageChange}>
        <div className="flex items-start space-x-2 mb-4">
          <RadioGroupItem value="cookies" id="cookies" />
          <div className="grid gap-1.5">
            <Label
              htmlFor="cookies"
              className="font-medium flex items-center gap-2"
            >
              <Cookie className="h-4 w-4" />
              {t("cookiesStorage")}
              <Badge variant="secondary" className="ml-2">
                {t("default")}
              </Badge>
            </Label>
            <p className="text-sm text-muted-foreground">
              {t("cookiesStorageDesc")}
            </p>
          </div>
        </div>

        <div className="flex items-start space-x-2 mb-4">
          <RadioGroupItem
            value="localStorage"
            id="localStorage"
            // disabled={!user.isLoggedIn}
          />
          <div className="grid gap-1.5">
            <Label
              htmlFor="localStorage"
              className={`font-medium flex items-center gap-2 ${
                !user.isLoggedIn ? "text-muted-foreground" : ""
              }`}
            >
              <HardDrive className="h-4 w-4" />
              {t("localStorage")}
              <Badge variant="outline" className="ml-2">
                {t("loginRequired")}
              </Badge>
            </Label>
            <p className="text-sm text-muted-foreground">
              {t("localStorageDesc")}
            </p>
          </div>
        </div>

        <div className="flex items-start space-x-2">
          <RadioGroupItem
            value="cloud"
            id="cloud"
            // disabled={!user.isLoggedIn || !user.hasPremium}
          />
          <div className="grid gap-1.5">
            <Label
              htmlFor="cloud"
              className={`font-medium flex items-center gap-2 ${
                !user.isLoggedIn || !user.hasPremium
                  ? "text-muted-foreground"
                  : ""
              }`}
            >
              <Cloud className="h-4 w-4" />
              {t("cloudStorage")}
              <Badge variant="outline" className="ml-2">
                {t("premium")}
              </Badge>
            </Label>
            <p className="text-sm text-muted-foreground">
              {t("cloudStorageDesc")}
            </p>
          </div>
        </div>
      </RadioGroup>

      <div className="pt-4 border-t">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-sm font-medium">{t("resetAllData")}</h4>
            <p className="text-xs text-muted-foreground">
              {t("resetAllDataDesc")}
            </p>
          </div>
          <Button variant="destructive" size="sm" onClick={openResetDialog}>
            {t("resetNow")}
          </Button>
        </div>
      </div>

      <div className="flex items-start gap-2 p-3 bg-amber-50 dark:bg-amber-950/30 rounded-md mt-4">
        <Info className="h-5 w-5 text-amber-500 mt-0.5 flex-shrink-0" />
        <div className="text-sm text-amber-800 dark:text-amber-300">
          <p className="font-medium">
            {t("currentStorage")}: {getStorageDisplayName(storageType)}
          </p>
          <p className="mt-1">
            {storageType === "cookies" && (
              <span className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                {t("cookieExpirationWarning").replace(
                  "{time}",
                  getCookieExpirationText(),
                )}
              </span>
            )}
            {storageType === "localStorage" && t("localStorageInfo")}
            {storageType === "cloud" && t("cloudStorageInfo")}
          </p>
        </div>
      </div>
    </div>
  );
}
